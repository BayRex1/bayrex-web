import { getMemoryStorage } from "../../../../services/account/AccountStorage.js";
import { getDate } from "../../../../system/global/Function.js";

// Вспомогательные функции для работы с памятью
const userLiked = async (postId, userId) => {
    const memoryStorage = getMemoryStorage();
    const key = `${postId}_${userId}`;
    const like = memoryStorage.likes.get(key);
    return like && like.type === 'like';
};

const userDisliked = async (postId, userId) => {
    const memoryStorage = getMemoryStorage();
    const key = `${postId}_${userId}`;
    const like = memoryStorage.likes.get(key);
    return like && like.type === 'dislike';
};

const recalculate = async (postId) => {
    const memoryStorage = getMemoryStorage();
    const postKey = `post_${postId}`;
    const postLikes = memoryStorage.postLikes.get(postKey) || { likes: new Set(), dislikes: new Set() };
    
    // Обновляем счетчик в посте
    const post = memoryStorage.posts.get(postId);
    if (post) {
        post.likes = postLikes.likes.size;
        post.dislikes = postLikes.dislikes.size;
        memoryStorage.posts.set(postId, post);
        console.log(`📊 Пост ${postId}: лайки=${postLikes.likes.size}, дизлайки=${postLikes.dislikes.size}`);
    }
};

// Лайк поста
export const like = async ({ account, data }) => {
    try {
        const { post_id } = data.payload || data; // Поддерживаем оба формата
        
        if (!post_id) {
            return { status: 'error', message: 'Не указан ID поста' };
        }

        console.log('❤️  Запрос на лайк:', {
            user: account?.Username,
            userId: account?.ID,
            postId: post_id
        });

        const memoryStorage = getMemoryStorage();
        
        // Проверяем, существует ли пост
        const post = memoryStorage.posts.get(Number(post_id));
        if (!post) {
            return { status: 'error', message: 'Пост не найден' };
        }

        const key = `${post_id}_${account.ID}`;
        const postKey = `post_${post_id}`;
        
        // Если уже лайкнул - убираем лайк
        if (await userLiked(post_id, account.ID)) {
            memoryStorage.likes.delete(key);
            
            // Обновляем счетчик поста
            const postLikes = memoryStorage.postLikes.get(postKey);
            if (postLikes) {
                postLikes.likes.delete(account.ID);
            }
            
            console.log(`🗑️  Лайк удален: пост ${post_id}, пользователь ${account.ID}`);
        } 
        // Если дизлайкнул - убираем дизлайк и ставим лайк
        else if (await userDisliked(post_id, account.ID)) {
            memoryStorage.likes.delete(key);
            
            // Обновляем счетчики
            const postLikes = memoryStorage.postLikes.get(postKey);
            if (postLikes) {
                postLikes.dislikes.delete(account.ID);
                postLikes.likes.add(account.ID);
            }
            
            // Добавляем лайк
            const likeId = memoryStorage.nextLikeId++;
            memoryStorage.likes.set(key, {
                id: likeId,
                postId: post_id,
                userId: account.ID,
                type: 'like',
                date: getDate()
            });
            
            console.log(`🔄 Дизлайк заменен на лайк: пост ${post_id}`);
        }
        // Если не реагировал - ставим лайк
        else {
            const likeId = memoryStorage.nextLikeId++;
            memoryStorage.likes.set(key, {
                id: likeId,
                postId: post_id,
                userId: account.ID,
                type: 'like',
                date: getDate()
            });
            
            // Обновляем счетчик поста
            let postLikes = memoryStorage.postLikes.get(postKey);
            if (!postLikes) {
                postLikes = { likes: new Set(), dislikes: new Set() };
                memoryStorage.postLikes.set(postKey, postLikes);
            }
            postLikes.likes.add(account.ID);
            
            console.log(`✅ Лайк поставлен: пост ${post_id}, пользователь ${account.ID}`);
        }

        // Пересчитываем счетчики
        await recalculate(post_id);

        // Уведомление автору (заглушка для режима памяти)
        if (post.author_type === 0 && post.author_id !== account.ID) {
            console.log(`📨 Уведомление автору поста ${post_id} о лайке`);
            // Позже можно добавить логику уведомлений
        }

        // Получаем обновленные счетчики
        const postLikes = memoryStorage.postLikes.get(postKey) || { likes: new Set(), dislikes: new Set() };
        
        return { 
            status: 'success', 
            message: 'Лайк обновлен',
            stats: {
                likes: postLikes.likes.size,
                dislikes: postLikes.dislikes.size,
                user_liked: await userLiked(post_id, account.ID),
                user_disliked: await userDisliked(post_id, account.ID)
            }
        };
        
    } catch (error) {
        console.error('❌ Ошибка при лайке поста:', error);
        return { status: 'error', message: error.message || 'Ошибка при лайке поста' };
    }
};

// Дизлайк поста
export const dislike = async ({ account, data }) => {
    try {
        const { post_id } = data.payload || data;
        
        if (!post_id) {
            return { status: 'error', message: 'Не указан ID поста' };
        }

        console.log('👎 Запрос на дизлайк:', {
            user: account?.Username,
            userId: account?.ID,
            postId: post_id
        });

        const memoryStorage = getMemoryStorage();
        
        // Проверяем, существует ли пост
        const post = memoryStorage.posts.get(Number(post_id));
        if (!post) {
            return { status: 'error', message: 'Пост не найден' };
        }

        const key = `${post_id}_${account.ID}`;
        const postKey = `post_${post_id}`;
        
        // Если уже дизлайкнул - убираем дизлайк
        if (await userDisliked(post_id, account.ID)) {
            memoryStorage.likes.delete(key);
            
            // Обновляем счетчик поста
            const postLikes = memoryStorage.postLikes.get(postKey);
            if (postLikes) {
                postLikes.dislikes.delete(account.ID);
            }
            
            console.log(`🗑️  Дизлайк удален: пост ${post_id}, пользователь ${account.ID}`);
        } 
        // Если лайкнул - убираем лайк и ставим дизлайк
        else if (await userLiked(post_id, account.ID)) {
            memoryStorage.likes.delete(key);
            
            // Обновляем счетчики
            const postLikes = memoryStorage.postLikes.get(postKey);
            if (postLikes) {
                postLikes.likes.delete(account.ID);
                postLikes.dislikes.add(account.ID);
            }
            
            // Добавляем дизлайк
            const likeId = memoryStorage.nextLikeId++;
            memoryStorage.likes.set(key, {
                id: likeId,
                postId: post_id,
                userId: account.ID,
                type: 'dislike',
                date: getDate()
            });
            
            console.log(`🔄 Лайк заменен на дизлайк: пост ${post_id}`);
        }
        // Если не реагировал - ставим дизлайк
        else {
            const likeId = memoryStorage.nextLikeId++;
            memoryStorage.likes.set(key, {
                id: likeId,
                postId: post_id,
                userId: account.ID,
                type: 'dislike',
                date: getDate()
            });
            
            // Обновляем счетчик поста
            let postLikes = memoryStorage.postLikes.get(postKey);
            if (!postLikes) {
                postLikes = { likes: new Set(), dislikes: new Set() };
                memoryStorage.postLikes.set(postKey, postLikes);
            }
            postLikes.dislikes.add(account.ID);
            
            console.log(`✅ Дизлайк поставлен: пост ${post_id}, пользователь ${account.ID}`);
        }

        // Пересчитываем счетчики
        await recalculate(post_id);

        // Уведомление автору (заглушка)
        if (post.author_type === 0 && post.author_id !== account.ID) {
            console.log(`📨 Уведомление автору поста ${post_id} о дизлайке`);
        }

        // Получаем обновленные счетчики
        const postLikes = memoryStorage.postLikes.get(postKey) || { likes: new Set(), dislikes: new Set() };
        
        return { 
            status: 'success', 
            message: 'Дизлайк обновлен',
            stats: {
                likes: postLikes.likes.size,
                dislikes: postLikes.dislikes.size,
                user_liked: await userLiked(post_id, account.ID),
                user_disliked: await userDisliked(post_id, account.ID)
            }
        };
        
    } catch (error) {
        console.error('❌ Ошибка при дизлайке поста:', error);
        return { status: 'error', message: error.message || 'Ошибка при дизлайке поста' };
    }
};
