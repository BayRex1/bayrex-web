import AccountDataHelper from '../account/AccountDataHelper.js';
import RouterHelper from '../system/RouterHelper.js';
import AccountManager from '../account/AccountManager.js';
import Validator from '../system/Validator.js';
import { getDate } from '../../system/global/Function.js';
import AppError from '../system/AppError.js';

class PostManager {
    static create = async ({ account, payload }) => {
        try {
            console.log(`📝 Создание поста от пользователя ${account.ID}`, payload);
            
            const accountManager = new AccountManager(account.ID);
            const currentPermissions = await accountManager.getPermissions();

            // Проверка разрешений
            if (!currentPermissions || !currentPermissions.Posts) {
                return RouterHelper.error('У вас ограничена возможность публикации постов');
            }

            const { text = '', files, type = 0, songs = 0, wall, from, settings } = payload || {};

            // Определяем отправителя
            let sender = {
                id: account.ID,
                type: 0
            };

            if (from && from.id && from.type) {
                if (from.type === 1) {
                    // Проверяем владение каналом
                    const channel = memoryStorage.channels.get(from.id);
                    if (channel && channel.Owner === account.ID) {
                        sender = {
                            id: from.id,
                            type: 1
                        };
                    } else {
                        return RouterHelper.error('Канал не найден или вы не владелец');
                    }
                }
            }

            // Базовая валидация
            const filesCount = files?.length || 0;
            if (!text && text.trim() === '' && filesCount < 1 && songs < 1) {
                return RouterHelper.error('Нельзя отправить пустой пост');
            }

            // Проверка времени (раз в 15 секунд)
            if (await this.checkTime({ id: sender.id, type: sender.type })) {
                return RouterHelper.error('Отправить пост можно раз в 15 секунд');
            }

            // Валидация текста
            if (text) {
                const validator = new Validator();
                validator.validateText({
                    title: 'Текст поста',
                    value: text,
                    maxLength: 30000
                });
            }

            // Определяем тип контента
            let contentType = 'text';
            if (filesCount > 0) {
                contentType = 'mixed';
                if (filesCount > 150) {
                    return RouterHelper.error('Максимальное количество файлов 150');
                }
            }

            // Формируем контент
            let content = {};
            
            // Обработка музыки (заглушка)
            if (songs && songs.length > 0) {
                content.songs = songs.map(songId => ({
                    song_id: songId
                }));
            }

            // Обработка файлов (заглушка для разработки)
            if (files && files.length > 0) {
                content.images = files
                    .filter(file => file.type?.startsWith('image/'))
                    .map(file => ({
                        img_data: { url: `mock://image/${file.name}` },
                        file_name: file.name,
                        file_size: file.size || 0
                    }));
                
                content.videos = files
                    .filter(file => file.type?.startsWith('video/'))
                    .map(file => ({
                        file: `mock://video/${file.name}`,
                        name: file.name,
                        size: file.size || 0,
                        info: { width: 1920, height: 1080 }
                    }));
                
                content.files = files
                    .filter(file => !file.type?.startsWith('image/') && !file.type?.startsWith('video/'))
                    .map(file => ({
                        file: `mock://file/${file.name}`,
                        name: file.name,
                        size: file.size || 0
                    }));
            }

            if (settings?.censoring_img) {
                content.censoring = true;
            }

            // Создаем пост в памяти
            const postId = memoryStorage.nextPostId++;
            const newPost = {
                id: postId,
                author_id: sender.id,
                author_type: sender.type,
                content_type: contentType,
                text: text,
                content: content,
                date: getDate(),
                hidden: 0,
                in_trash: 0,
                deleted_at: null
            };

            memoryStorage.posts.set(postId, newPost);

            // Обработка стены (wall)
            if (type === 'wall' && wall && wall.username) {
                // Заглушка для стены
                console.log(`📌 Пост добавлен на стену пользователя ${wall.username}`);
            }

            // Награда за пост
            await accountManager.maybeReward('post');
            
            // Обновляем счетчик постов
            await this.recount(sender.id, sender.type);

            console.log(`✅ Пост создан (ID: ${postId}) от ${sender.type === 0 ? 'пользователя' : 'канала'} ${sender.id}`);
            
            return RouterHelper.success({ post_id: postId });
            
        } catch (error) {
            console.error('❌ Ошибка при создании поста:', error);
            return RouterHelper.error(error.message || 'Ошибка при создании поста');
        }
    }

    static async recount(author_id, author_type) {
        try {
            // Считаем посты
            let postCount = 0;
            for (const post of memoryStorage.posts.values()) {
                if (post.author_id === author_id && 
                    post.author_type === author_type && 
                    post.hidden === 0) {
                    postCount++;
                }
            }
            
            if (author_type === 0) {
                // Обновляем счетчик у аккаунта
                const account = memoryStorage.accounts.get(author_id);
                if (account) {
                    account.Posts = postCount;
                    memoryStorage.accounts.set(author_id, account);
                    console.log(`📊 У аккаунта ${author_id} теперь ${postCount} постов`);
                }
            } else if (author_type === 1) {
                // Обновляем счетчик у канала
                const channel = memoryStorage.channels.get(author_id);
                if (channel) {
                    channel.Posts = postCount;
                    memoryStorage.channels.set(author_id, channel);
                    console.log(`📊 У канала ${author_id} теперь ${postCount} постов`);
                }
            }
            
            return postCount;
        } catch (error) {
            console.error('❌ Ошибка при подсчете постов:', error);
        }
    }

    static async moveToTrash({ account, pid }) {
        try {
            console.log(`🗑️  Удаление поста ${pid} пользователем ${account.ID}`);
            
            const post = memoryStorage.posts.get(Number(pid));
            if (!post) {
                return RouterHelper.error('Пост не найден');
            }

            const canManageAny = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;

            if (!canManageAny) {
                if (post.author_type === 0) {
                    if (Number(post.author_id) !== Number(account.ID)) {
                        return RouterHelper.error('Вы не владелец этого поста');
                    }
                } else if (post.author_type === 1) {
                    const channel = memoryStorage.channels.get(post.author_id);
                    if (!channel) {
                        return RouterHelper.error('Канал не найден');
                    }
                    if (Number(channel.Owner) !== Number(account.ID)) {
                        return RouterHelper.error('Вы не владелец этого поста');
                    }
                } else {
                    return RouterHelper.error('Неверный тип автора');
                }
            }

            // Помечаем как удаленный
            post.in_trash = 1;
            post.deleted_at = getDate();
            memoryStorage.posts.set(Number(pid), post);

            console.log(`✅ Пост ${pid} перемещен в корзину`);
            
            return RouterHelper.success({
                message: 'Пост успешно удален'
            });
            
        } catch (error) {
            console.error('❌ Ошибка при удалении поста:', error);
            return RouterHelper.error(error.message || 'Ошибка при удалении поста');
        }
    }

    static async checkTime(from) {
        try {
            // Находим последний пост от этого автора
            let lastPost = null;
            for (const post of memoryStorage.posts.values()) {
                if (post.author_id === from.id && post.author_type === from.type) {
                    if (!lastPost || new Date(post.date) > new Date(lastPost.date)) {
                        lastPost = post;
                    }
                }
            }

            if (lastPost) {
                const timeLimit = 15; // 15 секунд
                const lastPostTime = new Date(lastPost.date).getTime() / 1000;
                const currentTime = Math.floor(Date.now() / 1000);
                const elapsedTime = currentTime - lastPostTime;

                return elapsedTime < timeLimit;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Ошибка при проверке времени:', error);
            return false;
        }
    }

    // Новый метод для получения постов
    static async getPosts({ limit = 20, offset = 0, author_id, author_type } = {}) {
        try {
            console.log(`📄 Получение постов: author=${author_id}, type=${author_type}, limit=${limit}`);
            
            let postsArray = Array.from(memoryStorage.posts.values())
                .filter(post => post.hidden === 0 && post.in_trash === 0);

            // Фильтрация по автору
            if (author_id !== undefined && author_type !== undefined) {
                postsArray = postsArray.filter(post => 
                    post.author_id === author_id && post.author_type === author_type
                );
            }

            // Сортировка по дате (новые первыми)
            postsArray.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Пагинация
            const paginatedPosts = postsArray.slice(offset, offset + limit);

            // Форматируем ответ
            const formattedPosts = await Promise.all(paginatedPosts.map(async post => {
                // Получаем информацию об авторе
                let authorInfo = null;
                if (post.author_type === 0) {
                    const account = memoryStorage.accounts.get(post.author_id);
                    if (account) {
                        authorInfo = {
                            id: account.ID,
                            name: account.Name,
                            username: account.Username,
                            avatar: account.Avatar
                        };
                    }
                } else if (post.author_type === 1) {
                    const channel = memoryStorage.channels.get(post.author_id);
                    if (channel) {
                        authorInfo = {
                            id: channel.ID,
                            name: channel.Name,
                            username: channel.Username,
                            avatar: channel.Avatar
                        };
                    }
                }

                return {
                    id: post.id,
                    text: post.text,
                    content: post.content,
                    content_type: post.content_type,
                    date: post.date,
                    author: authorInfo,
                    stats: {
                        likes: 0,
                        comments: 0,
                        shares: 0
                    }
                };
            }));

            console.log(`✅ Получено ${formattedPosts.length} постов`);
            
            return {
                posts: formattedPosts,
                has_more: postsArray.length > offset + limit,
                total: postsArray.length
            };
            
        } catch (error) {
            console.error('❌ Ошибка при получении постов:', error);
            return { posts: [], has_more: false, total: 0 };
        }
    }

    // Метод для получения одного поста
    static async getPostById(postId) {
        const post = memoryStorage.posts.get(Number(postId));
        if (!post || post.hidden === 1 || post.in_trash === 1) {
            return null;
        }

        // Получаем информацию об авторе
        let authorInfo = null;
        if (post.author_type === 0) {
            const account = memoryStorage.accounts.get(post.author_id);
            if (account) {
                authorInfo = {
                    id: account.ID,
                    name: account.Name,
                    username: account.Username,
                    avatar: account.Avatar
                };
            }
        } else if (post.author_type === 1) {
            const channel = memoryStorage.channels.get(post.author_id);
            if (channel) {
                authorInfo = {
                    id: channel.ID,
                    name: channel.Name,
                    username: channel.Username,
                    avatar: channel.Avatar
                };
            }
        }

        return {
            id: post.id,
            text: post.text,
            content: post.content,
            content_type: post.content_type,
            date: post.date,
            author: authorInfo,
            stats: {
                likes: 0,
                comments: 0,
                shares: 0
            }
        };
    }
}

export default PostManager;
