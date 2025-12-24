import AccountDataHelper from '../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../services/system/RouterHelper.js';
import { getMemoryStorage } from '../../../services/account/AccountStorage.js';

const handleContent = async (content) => {
    if (!content || typeof content !== 'object') return null;
    
    // В режиме памяти просто возвращаем контент как есть
    return content;
};

const handlePost = async (post, account) => {
    try {
        const memoryStorage = getMemoryStorage();
        let myPost = false;

        const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;
        const deleted = post.in_trash === 1 && canViewTrash;

        // Получаем информацию об авторе из памяти
        let author = null;
        if (post.author_type === 0) {
            const accountData = memoryStorage.accounts.get(post.author_id);
            if (accountData) {
                author = {
                    type: 0,
                    data: {
                        ID: accountData.ID,
                        Name: accountData.Name,
                        Username: accountData.Username,
                        Avatar: accountData.Avatar,
                        Owner: accountData.ID
                    }
                };
            }
        } else if (post.author_type === 1) {
            const channel = memoryStorage.channels.get(post.author_id);
            if (channel) {
                author = {
                    type: 1,
                    data: {
                        ID: channel.ID,
                        Name: channel.Name,
                        Username: channel.Username,
                        Avatar: channel.Avatar,
                        Owner: channel.Owner
                    }
                };
            }
        }

        if (!author) {
            console.log(`❌ Автор поста ${post.id} не найден в памяти`);
            return null;
        }

        // Проверяем, является ли пост "моим"
        if (account) {
            if (parseInt(author.type) === 0 && author.data.ID === account.ID) myPost = true;
            if (parseInt(author.type) === 1 && author.data.Owner === account.ID) myPost = true;
        }

        // Проверка блокировки (заглушка для режима памяти)
        const isBlocked = false;
        const userIcons = [];

        return {
            id: post.id,
            author: {
                id: author.data.ID,
                type: author.type,
                username: author.data.Username,
                name: author.data.Name,
                avatar: author.data.Avatar,
                icons: userIcons,
                blocked: isBlocked
            },
            text: post.text,
            content: await handleContent(post.content || {}),
            create_date: post.date,
            likes: post.likes || 0,
            dislikes: post.dislikes || 0,
            liked: false, // Заглушка для режима памяти
            disliked: false, // Заглушка для режима памяти
            comments: post.comments || 0,
            my_post: myPost,
            ...(deleted && { deleted: true }),
        };
    } catch (error) {
        console.error('❌ Ошибка при обработке поста:', error);
        return null;
    }
};

// Функция для фильтрации постов по блокировкам
const filterBlockedPosts = (posts, account) => {
    if (!account) return posts;
    
    // В режиме памяти просто возвращаем все посты
    // Позже можно добавить логику блокировок
    return posts;
};

// Загрузка постов профиля
const loadPostsProfile = async ({ account, authorID, authorType, start_index }) => {
    try {
        const memoryStorage = getMemoryStorage();
        const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;
        
        // Получаем все посты из памяти
        let postsArray = Array.from(memoryStorage.posts.values())
            .filter(post => 
                post.author_id === authorID && 
                post.author_type === authorType && 
                post.hidden === 0 &&
                (canViewTrash || post.in_trash === 0)
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Пагинация
        const paginatedPosts = postsArray.slice(start_index, start_index + 25);

        const handledPosts = await Promise.all(
            paginatedPosts.map(post => handlePost(post, account))
        );

        const validPosts = handledPosts.filter(post => post !== null);

        console.log(`✅ Загружено ${validPosts.length} постов профиля`);
        
        return RouterHelper.success({ 
            posts: validPosts,
            has_more: postsArray.length > start_index + 25
        });
    } catch (error) {
        console.error('❌ Ошибка при загрузке постов профиля:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};

// Загрузка постов подписок (заглушка для режима памяти)
const loadPostsSub = async ({ account, start_index }) => {
    try {
        const memoryStorage = getMemoryStorage();
        const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;
        
        // В режиме памяти возвращаем все посты (позже можно добавить логику подписок)
        let postsArray = Array.from(memoryStorage.posts.values())
            .filter(post => 
                post.hidden === 0 &&
                (canViewTrash || post.in_trash === 0)
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Пагинация
        const paginatedPosts = postsArray.slice(start_index, start_index + 25);

        const handledPosts = await Promise.all(
            paginatedPosts.map(post => handlePost(post, account))
        );

        const validPosts = handledPosts.filter(post => post !== null);

        console.log(`✅ Загружено ${validPosts.length} постов подписок`);
        
        return RouterHelper.success({ 
            posts: validPosts,
            has_more: postsArray.length > start_index + 25
        });
    } catch (error) {
        console.error('❌ Ошибка при загрузке постов подписок:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};

// Загрузка рекомендуемых постов
const loadPostsRec = async ({ account, start_index }) => {
    try {
        const memoryStorage = getMemoryStorage();
        const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;
        
        // Получаем все посты и перемешиваем для "рекомендаций"
        let postsArray = Array.from(memoryStorage.posts.values())
            .filter(post => 
                post.hidden === 0 &&
                (canViewTrash || post.in_trash === 0)
            );

        // Перемешиваем массив
        postsArray = postsArray.sort(() => Math.random() - 0.5);

        // Пагинация
        const paginatedPosts = postsArray.slice(start_index, start_index + 25);

        const handledPosts = await Promise.all(
            paginatedPosts.map(post => handlePost(post, account))
        );

        const validPosts = handledPosts.filter(post => post !== null);

        console.log(`✅ Загружено ${validPosts.length} рекомендуемых постов`);
        
        return RouterHelper.success({ 
            posts: validPosts,
            has_more: postsArray.length > start_index + 25
        });
    } catch (error) {
        console.error('❌ Ошибка при загрузке рекомендуемых постов:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};

// Загрузка последних постов
const loadPostsLast = async ({ account, start_index }) => {
    try {
        const memoryStorage = getMemoryStorage();
        const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;
        
        // Получаем все посты, сортируем по дате
        let postsArray = Array.from(memoryStorage.posts.values())
            .filter(post => 
                post.hidden === 0 &&
                (canViewTrash || post.in_trash === 0)
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        // Фильтруем заблокированных пользователей
        postsArray = filterBlockedPosts(postsArray, account);

        // Пагинация
        const paginatedPosts = postsArray.slice(start_index, start_index + 25);

        const handledPosts = await Promise.all(
            paginatedPosts.map(post => handlePost(post, account))
        );

        const validPosts = handledPosts.filter(post => post !== null);

        console.log(`✅ Загружено ${validPosts.length} последних постов`);
        
        return RouterHelper.success({ 
            posts: validPosts,
            has_more: postsArray.length > start_index + 25
        });
    } catch (error) {
        console.error('❌ Ошибка при загрузке последних постов:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};

// Загрузка постов стены (заглушка для режима памяти)
const loadPostsWall = async ({ account, username, start_index }) => {
    try {
        console.log(`📌 Загрузка постов стены для ${username} (режим памяти)`);
        
        // В режиме памяти просто возвращаем пустой массив
        // Позже можно добавить логику стены
        
        return RouterHelper.success({ 
            posts_type: 'wall', 
            posts: [],
            has_more: false
        });
    } catch (error) {
        console.error('❌ Ошибка при загрузке постов стены:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};

// Загрузка одного поста
export const loadPost = async ({ account, data }) => {
    try {
        const memoryStorage = getMemoryStorage();
        
        const post = memoryStorage.posts.get(Number(data.pid));
        
        if (!post) {
            return RouterHelper.error('Пост не найден');
        }

        const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;
        if (post.in_trash === 1 && !canViewTrash) {
            return RouterHelper.error('Пост не найден');
        }

        const handledPost = await handlePost(post, account);
        
        if (!handledPost) {
            return RouterHelper.error('Ошибка при обработке поста');
        }

        console.log(`✅ Загружен пост: ${data.pid}`);
        
        return RouterHelper.success({ post: handledPost });
        
    } catch (error) {
        console.error('❌ Ошибка при загрузке поста:', error);
        return RouterHelper.error('Ошибка при загрузке поста');
    }
};

// Основная функция загрузки постов
export const loadPosts = async ({ account, data }) => {
    try {
        const { posts_type, author_id, author_type, start_index = 0, username } = data.payload || {};

        console.log('📄 Загрузка постов:', {
            type: posts_type,
            author_id,
            author_type,
            start_index,
            username
        });

        switch (posts_type) {
            case 'profile':
                return await loadPostsProfile({
                    account,
                    authorID: author_id,
                    authorType: author_type,
                    start_index
                });
            case 'subscribe':
                return await loadPostsSub({ 
                    account, 
                    start_index 
                });
            case 'rec':
                return await loadPostsRec({ 
                    account, 
                    start_index 
                });
            case 'last':
                return await loadPostsLast({ 
                    account, 
                    start_index 
                });
            case 'wall':
                return await loadPostsWall({ 
                    account, 
                    username, 
                    start_index 
                });
            default:
                console.log(`❌ Неизвестный тип постов: ${posts_type}`);
                return RouterHelper.error('Ошибка при выводе постов');
        }
    } catch (error) {
        console.error('❌ Ошибка в loadPosts:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};
