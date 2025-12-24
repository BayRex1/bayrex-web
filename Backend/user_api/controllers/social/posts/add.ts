// controllers/social/posts/add.js - текущая версия
import PostManager from '../../../../services/posts/PostManager.js';

const add = async ({ account, data }) => {
    try {
        console.log('📝 Начало создания поста:', {
            user: account?.Username,
            userId: account?.ID,
            data: {
                ...data,
                text: data.text?.substring(0, 100) + (data.text?.length > 100 ? '...' : '')
            }
        });

        const { text, files, songs, type, wall, from, settings } = data.payload || data;
        
        // Исправляем формат songs, если нужно
        const songsArray = Array.isArray(songs) ? songs : (songs ? [songs] : []);
        
        const post = await PostManager.create({ 
            account, 
            payload: { 
                text, 
                files: files || [], 
                songs: songsArray, 
                type, 
                wall, 
                from,
                settings
            } 
        });

        return post;
    } catch (error) {
        console.error('❌ Ошибка в add контроллере:', error);
        return {
            status: 'error',
            message: error.message || 'Ошибка при создании поста'
        };
    }
}

export default add;
