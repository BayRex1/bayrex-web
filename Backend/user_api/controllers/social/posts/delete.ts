// controllers/social/posts/delete.js
import PostManager from '../../../../services/posts/PostManager.js';

export default async ({ account, data }) => {
    try {
        console.log('🗑️ Запрос на удаление поста:', {
            user: account?.Username,
            userId: account?.ID,
            postId: data.post_id || data.payload?.post_id
        });

        const postId = data.post_id || data.payload?.post_id;
        
        if (!postId) {
            return {
                status: 'error',
                message: 'Не указан ID поста'
            };
        }

        if (!account?.ID) {
            return {
                status: 'error',
                message: 'Пользователь не авторизован'
            };
        }

        const result = await PostManager.moveToTrash({ 
            account: {
                ID: account.ID,
                permissions: account.permissions || {}
            }, 
            pid: postId 
        });
        
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка при удалении поста:', error);
        return {
            status: 'error',
            message: error.message || 'Ошибка при удалении поста'
        };
    }
};
