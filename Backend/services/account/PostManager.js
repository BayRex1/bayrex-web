// services/account/PostManager.js
import { memoryStorage } from './AccountStorage.js';
import { getDate } from '../../system/global/Function.js';

export class PostManager {
    // Добавление поста
    static addPost(postData) {
        const postId = memoryStorage.nextPostId++;
        const post = {
            id: postId,
            ...postData,
            date: postData.date || getDate(),
            hidden: 0,
            in_trash: 0,
            deleted_at: null,
            likes: 0,
            dislikes: 0,
            comments: 0,
            shares: 0,
            views: 0
        };
        memoryStorage.posts.set(postId, post);
        
        // Создаем запись для лайков этого поста
        const postKey = `post_${postId}`;
        memoryStorage.postLikes.set(postKey, {
            likes: new Set(),
            dislikes: new Set()
        });
        
        console.log(`📝 Пост добавлен (ID: ${postId})`);
        return postId;
    }
    
    // Получение поста
    static getPost(postId) {
        return memoryStorage.posts.get(postId);
    }
    
    // Получение постов автора
    static getPostsByAuthor(authorId, authorType = 0, includeHidden = false) {
        const posts = [];
        for (const [id, post] of memoryStorage.posts.entries()) {
            if (post.author_id === authorId && post.author_type === authorType) {
                if (includeHidden || post.hidden === 0) {
                    posts.push({ id, ...post });
                }
            }
        }
        return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // Обновление поста
    static updatePost(postId, updates) {
        const post = memoryStorage.posts.get(postId);
        if (post) {
            const updatedPost = { ...post, ...updates };
            memoryStorage.posts.set(postId, updatedPost);
            console.log(`✏️  Пост ${postId} обновлен`);
            return true;
        }
        return false;
    }
    
    // Удаление поста (в корзину)
    static deletePost(postId) {
        const post = memoryStorage.posts.get(postId);
        if (post) {
            post.in_trash = 1;
            post.deleted_at = getDate();
            memoryStorage.posts.set(postId, post);
            console.log(`🗑️  Пост ${postId} перемещен в корзину`);
            return true;
        }
        return false;
    }
    
    // Полное удаление поста
    static removePost(postId) {
        const deleted = memoryStorage.posts.delete(postId);
        if (deleted) {
            // Удаляем связанные лайки
            const postKey = `post_${postId}`;
            memoryStorage.postLikes.delete(postKey);
            
            // Удаляем лайки из основного хранилища
            for (const [key, like] of memoryStorage.likes.entries()) {
                if (like.postId === postId) {
                    memoryStorage.likes.delete(key);
                }
            }
            
            console.log(`💥 Пост ${postId} полностью удален`);
        }
        return deleted;
    }
    
    // Получение всех постов (с фильтрацией)
    static getAllPosts(filters = {}) {
        let postsArray = Array.from(memoryStorage.posts.values());
        
        // Применяем фильтры
        if (filters.hidden !== undefined) {
            postsArray = postsArray.filter(post => post.hidden === filters.hidden);
        }
        
        if (filters.in_trash !== undefined) {
            postsArray = postsArray.filter(post => post.in_trash === filters.in_trash);
        }
        
        if (filters.author_id !== undefined && filters.author_type !== undefined) {
            postsArray = postsArray.filter(post => 
                post.author_id === filters.author_id && 
                post.author_type === filters.author_type
            );
        }
        
        // Сортировка
        const sortBy = filters.sortBy || 'date';
        const sortOrder = filters.sortOrder || 'desc';
        
        postsArray.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            if (sortOrder === 'desc') {
                return bValue - aValue;
            } else {
                return aValue - bValue;
            }
        });
        
        // Пагинация
        const limit = filters.limit || postsArray.length;
        const offset = filters.offset || 0;
        
        return postsArray.slice(offset, offset + limit);
    }
    
    // Подсчет постов
    static countPosts(authorId, authorType, includeHidden = false, includeTrash = false) {
        let count = 0;
        for (const post of memoryStorage.posts.values()) {
            if (post.author_id === authorId && post.author_type === authorType) {
                if ((includeHidden || post.hidden === 0) && 
                    (includeTrash || post.in_trash === 0)) {
                    count++;
                }
            }
        }
        return count;
    }
    
    // Обновление счетчика постов у аккаунта/канала
    static async updatePostCount(authorId, authorType) {
        const postCount = PostManager.countPosts(authorId, authorType);
        
        if (authorType === 0) {
            const account = memoryStorage.accounts.get(authorId);
            if (account) {
                account.Posts = postCount;
                account.last_post = getDate();
                memoryStorage.accounts.set(authorId, account);
                console.log(`📊 У аккаунта ${authorId} теперь ${postCount} постов`);
            }
        } else if (authorType === 1) {
            const channel = memoryStorage.channels.get(authorId);
            if (channel) {
                channel.Posts = postCount;
                memoryStorage.channels.set(authorId, channel);
                console.log(`📊 У канала ${authorId} теперь ${postCount} постов`);
            }
        }
        
        return postCount;
    }
    
    // Поиск постов
    static searchPosts(query, filters = {}) {
        const results = [];
        const searchQuery = query.toLowerCase();
        
        for (const [id, post] of memoryStorage.posts.entries()) {
            // Пропускаем скрытые и удаленные посты
            if (post.hidden === 1 || (post.in_trash === 1 && !filters.includeTrash)) {
                continue;
            }
            
            // Поиск по тексту
            if (post.text && post.text.toLowerCase().includes(searchQuery)) {
                results.push({ id, ...post, matchType: 'text' });
            }
            
            // Можно добавить поиск по другим полям
        }
        
        return results.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

// Экспорт функций
export const addPost = PostManager.addPost;
export const getPost = PostManager.getPost;
export const getPostsByAuthor = PostManager.getPostsByAuthor;
export const updatePost = PostManager.updatePost;
export const deletePost = PostManager.deletePost;
export const removePost = PostManager.removePost;
export const getAllPosts = PostManager.getAllPosts;
export const countPosts = PostManager.countPosts;
export const updatePostCount = PostManager.updatePostCount;
export const searchPosts = PostManager.searchPosts;

export default PostManager;
