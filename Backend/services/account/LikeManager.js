// services/account/LikeManager.js
import { memoryStorage } from './AccountStorage.js';
import { getDate } from '../../system/global/Function.js';

export class LikeManager {
    // Добавление лайка/дизлайка
    static addLike(postId, userId, type = 'like') {
        const key = `${postId}_${userId}`;
        const postKey = `post_${postId}`;
        
        // Удаляем противоположную реакцию если была
        const oppositeType = type === 'like' ? 'dislike' : 'like';
        const oppositeKey = `${postId}_${userId}`;
        
        if (memoryStorage.likes.has(oppositeKey)) {
            memoryStorage.likes.delete(oppositeKey);
            
            const postLikes = memoryStorage.postLikes.get(postKey) || { likes: new Set(), dislikes: new Set() };
            if (type === 'like') {
                postLikes.dislikes.delete(userId);
            } else {
                postLikes.likes.delete(userId);
            }
        }
        
        // Добавляем новую реакцию
        const likeId = memoryStorage.nextLikeId++;
        memoryStorage.likes.set(key, {
            id: likeId,
            postId,
            userId,
            type,
            date: getDate()
        });
        
        // Обновляем счетчик поста
        let postLikes = memoryStorage.postLikes.get(postKey);
        if (!postLikes) {
            postLikes = { likes: new Set(), dislikes: new Set() };
            memoryStorage.postLikes.set(postKey, postLikes);
        }
        
        if (type === 'like') {
            postLikes.likes.add(userId);
        } else {
            postLikes.dislikes.add(userId);
        }
        
        // Обновляем счетчик в посте
        const post = memoryStorage.posts.get(postId);
        if (post) {
            post.likes = postLikes.likes.size;
            post.dislikes = postLikes.dislikes.size;
            memoryStorage.posts.set(postId, post);
        }
        
        console.log(`❤️  ${type === 'like' ? 'Лайк' : 'Дизлайк'} добавлен: пост ${postId}, пользователь ${userId}`);
        return likeId;
    }
    
    // Удаление реакции
    static removeLike(postId, userId) {
        const key = `${postId}_${userId}`;
        const postKey = `post_${postId}`;
        
        if (memoryStorage.likes.has(key)) {
            const like = memoryStorage.likes.get(key);
            memoryStorage.likes.delete(key);
            
            // Обновляем счетчик поста
            const postLikes = memoryStorage.postLikes.get(postKey);
            if (postLikes) {
                if (like.type === 'like') {
                    postLikes.likes.delete(userId);
                } else {
                    postLikes.dislikes.delete(userId);
                }
            }
            
            // Обновляем счетчик в посте
            const post = memoryStorage.posts.get(postId);
            if (post) {
                post.likes = postLikes?.likes.size || 0;
                post.dislikes = postLikes?.dislikes.size || 0;
                memoryStorage.posts.set(postId, post);
            }
            
            console.log(`🗑️  Реакция удалена: пост ${postId}, пользователь ${userId}`);
            return true;
        }
        return false;
    }
    
    // Получение реакции пользователя
    static getUserReaction(postId, userId) {
        const key = `${postId}_${userId}`;
        const like = memoryStorage.likes.get(key);
        return like ? like.type : null;
    }
    
    // Статистика поста
    static getPostStats(postId) {
        const postKey = `post_${postId}`;
        const postLikes = memoryStorage.postLikes.get(postKey) || { likes: new Set(), dislikes: new Set() };
        return {
            likes: postLikes.likes.size,
            dislikes: postLikes.dislikes.size,
            userLikes: Array.from(postLikes.likes),
            userDislikes: Array.from(postLikes.dislikes)
        };
    }
    
    // Переключение лайка
    static toggleLike(postId, userId) {
        const currentReaction = LikeManager.getUserReaction(postId, userId);
        
        if (currentReaction === 'like') {
            LikeManager.removeLike(postId, userId);
            return { action: 'removed', type: 'like' };
        } else if (currentReaction === 'dislike') {
            LikeManager.removeLike(postId, userId);
            LikeManager.addLike(postId, userId, 'like');
            return { action: 'switched', from: 'dislike', to: 'like' };
        } else {
            LikeManager.addLike(postId, userId, 'like');
            return { action: 'added', type: 'like' };
        }
    }
    
    // Переключение дизлайка
    static toggleDislike(postId, userId) {
        const currentReaction = LikeManager.getUserReaction(postId, userId);
        
        if (currentReaction === 'dislike') {
            LikeManager.removeLike(postId, userId);
            return { action: 'removed', type: 'dislike' };
        } else if (currentReaction === 'like') {
            LikeManager.removeLike(postId, userId);
            LikeManager.addLike(postId, userId, 'dislike');
            return { action: 'switched', from: 'like', to: 'dislike' };
        } else {
            LikeManager.addLike(postId, userId, 'dislike');
            return { action: 'added', type: 'dislike' };
        }
    }
    
    // Обновление счетчиков поста
    static recalculatePost(postId) {
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
        
        return {
            likes: postLikes.likes.size,
            dislikes: postLikes.dislikes.size
        };
    }
    
    // Проверка, лайкнул ли пользователь пост
    static userLiked(postId, userId) {
        const key = `${postId}_${userId}`;
        const like = memoryStorage.likes.get(key);
        return like && like.type === 'like';
    }
    
    // Проверка, дизлайкнул ли пользователь пост
    static userDisliked(postId, userId) {
        const key = `${postId}_${userId}`;
        const like = memoryStorage.likes.get(key);
        return like && like.type === 'dislike';
    }
}

// Экспорт отдельных функций для совместимости
export const addLike = LikeManager.addLike;
export const removeLike = LikeManager.removeLike;
export const getUserReaction = LikeManager.getUserReaction;
export const getPostStats = LikeManager.getPostStats;
export const toggleLike = LikeManager.toggleLike;
export const toggleDislike = LikeManager.toggleDislike;
export const recalculatePost = LikeManager.recalculatePost;
export const userLiked = LikeManager.userLiked;
export const userDisliked = LikeManager.userDisliked;

export default LikeManager;
