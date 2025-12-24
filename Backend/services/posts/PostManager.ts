// services/posts/PostManager.js - исправляем импорты
import { getDate } from '../../system/global/Function.js';
import AccountDataHelper from '../account/AccountDataHelper.js';
import RouterHelper from '../system/RouterHelper.js';
import AccountManager from '../account/AccountManager.js';
import { getMemoryStorage } from '../account/AccountStorage.js'; // Исправляем импорт
import AppError from '../system/AppError.js';

class PostManager {
    static create = async ({ account, payload }) => {
        try {
            console.log('📝 PostManager.create вызван:', {
                user: account?.Username,
                text: payload.text?.substring(0, 50) + (payload.text?.length > 50 ? '...' : ''),
                files: payload.files?.length || 0,
                songs: payload.songs?.length || 0
            });

            // Получаем хранилище из памяти
            const memoryStorage = getMemoryStorage();
            
            // Проверяем доступность AccountManager
            let currentPermissions;
            try {
                const accountManager = new AccountManager(account.ID);
                currentPermissions = await accountManager.getPermissions();
            } catch (error) {
                console.log('⚠️  AccountManager не доступен, используем заглушку');
                currentPermissions = { Posts: true }; // Заглушка для тестирования
            }

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
                    // Проверяем владение каналом через память
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

            // Проверка времени (раз в 15 секунд) - заглушка для режима памяти
            const checkResult = await this.checkTime({ id: sender.id, type: sender.type });
            if (checkResult) {
                return RouterHelper.error('Отправить пост можно раз в 15 секунд');
            }

            // Проверка текста
            if (text && text.length > 30000) {
                return RouterHelper.error('Текст поста не должен превышать 30000 символов');
            }

            // Проверка файлов
            if (filesCount > 150) {
                return RouterHelper.error('Максимальное количество файлов 150');
            }

            // Определяем тип контента
            let contentType = 'text';
            if (filesCount > 0) {
                contentType = 'mixed';
            }

            // Формируем контент для хранения в памяти
            let content = {};
            
            // Музыка (заглушка для разработки)
            if (songs && songs.length > 0) {
                content.songs = songs.map(songId => ({
                    song_id: songId,
                    title: `Трек ${songId}`,
                    artist: 'Исполнитель'
                }));
            }

            // Файлы (заглушка для разработки в памяти)
            if (files && files.length > 0) {
                content.images = files
                    .filter(file => file.type?.startsWith('image/'))
                    .map((file, index) => ({
                        img_data: { 
                            url: `/mock/posts/images/${Date.now()}_${index}.jpg`,
                            size: file.size || 1024,
                            width: 1920,
                            height: 1080,
                            uploaded_at: getDate()
                        },
                        file_name: file.name || `image_${index}.jpg`,
                        file_size: file.size || 1024
                    }));
                
                content.videos = files
                    .filter(file => file.type?.startsWith('video/'))
                    .map((file, index) => ({
                        file: `/mock/posts/videos/${Date.now()}_${index}.mp4`,
                        name: file.name || `video_${index}.mp4`,
                        size: file.size || 5242880, // 5MB
                        info: { 
                            width: 1920, 
                            height: 1080, 
                            duration: 60,
                            format: 'mp4'
                        }
                    }));
                
                content.files = files
                    .filter(file => !file.type?.startsWith('image/') && !file.type?.startsWith('video/'))
                    .map((file, index) => ({
                        file: `/mock/posts/files/${Date.now()}_${index}.${getFileExtension(file.name)}`,
                        name: file.name || `file_${index}`,
                        size: file.size || 1024,
                        type: file.type || 'application/octet-stream'
                    }));
            }

            // Цензура
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
                deleted_at: null,
                likes: 0,
                dislikes: 0,
                comments: 0,
                shares: 0,
                views: 0
            };

            // Сохраняем в память
            memoryStorage.posts.set(postId, newPost);

            // Стена (wall) - заглушка
            if (type === 'wall' && wall && wall.username) {
                console.log(`📌 Пост добавлен на стену пользователя ${wall.username}`);
                // Можно добавить логику для стены позже
            }

            // Обновляем счетчик постов
            await this.recount(sender.id, sender.type);

            // Награда за пост (заглушка)
            console.log(`🎁 Награда за пост ${postId} (режим памяти)`);

            console.log(`✅ Пост создан (ID: ${postId})`);
            
            return RouterHelper.success({ 
                post_id: postId,
                message: 'Пост успешно создан'
            });
            
        } catch (error) {
            console.error('❌ Ошибка в PostManager.create:', error);
            return RouterHelper.error(error.message || 'Ошибка при создании поста');
        }
    }

    // Проверка времени между постами (заглушка для памяти)
    static async checkTime(from) {
        try {
            const memoryStorage = getMemoryStorage();
            
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

    // Подсчет постов
    static async recount(author_id, author_type) {
        try {
            const memoryStorage = getMemoryStorage();
            
            // Считаем посты
            let postCount = 0;
            for (const post of memoryStorage.posts.values()) {
                if (post.author_id === author_id && 
                    post.author_type === author_type && 
                    post.hidden === 0) {
                    postCount++;
                }
            }
            
            // Обновляем счетчик
            if (author_type === 0) {
                const account = memoryStorage.accounts.get(author_id);
                if (account) {
                    account.Posts = postCount;
                    console.log(`📊 У аккаунта ${author_id} теперь ${postCount} постов`);
                }
            } else if (author_type === 1) {
                const channel = memoryStorage.channels.get(author_id);
                if (channel) {
                    channel.Posts = postCount;
                    console.log(`📊 У канала ${author_id} теперь ${postCount} постов`);
                }
            }
            
            return postCount;
        } catch (error) {
            console.error('❌ Ошибка при подсчете постов:', error);
        }
    }

    // Удаление поста
    static async moveToTrash({ account, pid }) {
        try {
            const memoryStorage = getMemoryStorage();
            const post = memoryStorage.posts.get(Number(pid));
            
            if (!post) {
                return RouterHelper.error('Пост не найден');
            }

            // Проверяем права
            let canManageAny = false;
            if (account?.permissions) {
                canManageAny = account.permissions.Admin || account.permissions.Moderator;
            }

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

            // Обновляем счетчик
            await this.recount(post.author_id, post.author_type);

            console.log(`✅ Пост ${pid} перемещен в корзину`);
            
            return RouterHelper.success({
                message: 'Пост успешно удален'
            });
            
        } catch (error) {
            console.error('❌ Ошибка при удалении поста:', error);
            return RouterHelper.error(error.message || 'Ошибка при удалении поста');
        }
    }

    // Методы для совместимости
    static async getFilesType(files) {
        return 'mixed';
    };
}

// Вспомогательная функция
function getFileExtension(filename) {
    if (!filename) return 'txt';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'txt';
}

export default PostManager;
