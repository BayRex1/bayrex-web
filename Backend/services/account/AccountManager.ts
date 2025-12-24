import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Config from './Config.js';
import AppError from '../../services/system/AppError.js';

// Хранилище в памяти - ПОЛНАЯ ВЕРСИЯ
const memoryStorage = {
    // Основные хранилища
    accounts: new Map(),
    sessions: new Map(),
    permissions: new Map(),
    
    // Контент
    posts: new Map(),
    channels: new Map(),
    songs: new Map(),
    images: new Map(),
    files: new Map(),
    comments: new Map(),
    
    // Взаимодействия
    likes: new Map(),           // ключ: `${postId}_${userId}`, значение: объект лайка
    postLikes: new Map(),       // ключ: `post_${postId}`, значение: {likes: Set, dislikes: Set}
    subscriptions: new Map(),   // ключ: `${userId}_${targetId}_${targetType}`
    blocks: new Map(),          // ключ: `${userId}_${authorId}_${authorType}`
    
    // Уведомления и прочее
    notifications: new Map(),
    messages: new Map(),
    gifts: new Map(),
    reports: new Map(),
    appeals: new Map(),
    punishments: new Map(),
    
    // Счетчики для генерации ID
    nextAccountId: 1000,
    nextPostId: 1000,
    nextSongId: 1000,
    nextChannelId: 1000,
    nextImageId: 1000,
    nextFileId: 1000,
    nextCommentId: 1000,
    nextLikeId: 1000,
    nextNotificationId: 1000,
    nextMessageId: 1000,
    nextGiftId: 1000,
    nextReportId: 1000,
    nextAppealId: 1000,
    nextPunishmentId: 1000
};

// Инициализация тестовых данных
(() => {
    // Тестовый аккаунт 1
    const testAccountId = 1;
    const hashedPassword = bcrypt.hashSync('test123', 10);
    
    memoryStorage.accounts.set(testAccountId, {
        ID: testAccountId,
        Name: 'Тестовый пользователь',
        Username: 'testuser',
        Email: 'test@example.com',
        Password: hashedPassword,
        CreateDate: new Date().toISOString(),
        Avatar: null,
        Cover: null,
        Description: 'Тестовый аккаунт для разработки',
        Eballs: 1000,
        Notifications: 0,
        messenger_size: 0,
        Posts: 1,
        last_post: new Date().toISOString()
    });
    
    memoryStorage.permissions.set(testAccountId, {
        UserID: testAccountId,
        Posts: true,
        Comments: true,
        NewChats: true,
        MusicUpload: true,
        Admin: true,
        Verified: true,
        Fake: false
    });
    
    // Тестовый аккаунт 2 (для взаимодействий)
    const testAccountId2 = 2;
    const hashedPassword2 = bcrypt.hashSync('test456', 10);
    
    memoryStorage.accounts.set(testAccountId2, {
        ID: testAccountId2,
        Name: 'Второй пользователь',
        Username: 'user2',
        Email: 'user2@example.com',
        Password: hashedPassword2,
        CreateDate: new Date().toISOString(),
        Avatar: null,
        Cover: null,
        Description: 'Второй тестовый аккаунт',
        Eballs: 500,
        Notifications: 0,
        messenger_size: 0,
        Posts: 0,
        last_post: null
    });
    
    memoryStorage.permissions.set(testAccountId2, {
        UserID: testAccountId2,
        Posts: true,
        Comments: true,
        NewChats: true,
        MusicUpload: false,
        Admin: false,
        Verified: false,
        Fake: false
    });
    
    // Тестовые сессии
    const testSessionKey1 = 'test_session_key_1_' + Date.now();
    memoryStorage.sessions.set(testSessionKey1, {
        uid: testAccountId,
        s_key: testSessionKey1,
        device_type: 1,
        device: 'Chrome Windows',
        create_date: new Date().toISOString(),
        aesKey: 'test_aes_key_1',
        mesKey: 'test_mes_key_1',
        connection: null,
        lastActive: new Date().toISOString()
    });
    
    const testSessionKey2 = 'test_session_key_2_' + Date.now();
    memoryStorage.sessions.set(testSessionKey2, {
        uid: testAccountId2,
        s_key: testSessionKey2,
        device_type: 1,
        device: 'Firefox Mac',
        create_date: new Date().toISOString(),
        aesKey: 'test_aes_key_2',
        mesKey: 'test_mes_key_2',
        connection: null,
        lastActive: new Date().toISOString()
    });
    
    // Тестовый пост
    const testPostId = 1;
    memoryStorage.posts.set(testPostId, {
        id: testPostId,
        author_id: testAccountId,
        author_type: 0,
        content_type: 'text',
        text: '👋 Привет! Это тестовый пост для разработки.',
        content: {
            images: []
        },
        date: new Date().toISOString(),
        hidden: 0,
        in_trash: 0,
        deleted_at: null,
        likes: 1,
        dislikes: 0,
        comments: 0,
        shares: 0,
        views: 0
    });
    
    // Тестовый лайк
    const testLikeId = memoryStorage.nextLikeId++;
    memoryStorage.likes.set(`1_1`, {
        id: testLikeId,
        postId: 1,
        userId: 1,
        type: 'like',
        date: new Date().toISOString()
    });
    
    const postKey = `post_1`;
    memoryStorage.postLikes.set(postKey, {
        likes: new Set([1]),
        dislikes: new Set()
    });
    
    // Тестовый канал
    const testChannelId = 1;
    memoryStorage.channels.set(testChannelId, {
        ID: testChannelId,
        Name: 'Тестовый канал',
        Username: 'testchannel',
        Owner: testAccountId,
        Avatar: null,
        Cover: null,
        Description: 'Тестовый канал для разработки',
        Subscribers: 0,
        Posts: 0,
        CreateDate: new Date().toISOString()
    });
    
    console.log('========================================');
    console.log('✅ ИНИЦИАЛИЗАЦИЯ ПАМЯТИ ЗАВЕРШЕНА');
    console.log(`📊 Аккаунты: ${memoryStorage.accounts.size}`);
    console.log(`📊 Сессии: ${memoryStorage.sessions.size}`);
    console.log(`📊 Посты: ${memoryStorage.posts.size}`);
    console.log(`📊 Лайки: ${memoryStorage.likes.size}`);
    console.log(`📊 Каналы: ${memoryStorage.channels.size}`);
    console.log('========================================');
    console.log('🔑 Тестовый аккаунт 1: testuser / test123');
    console.log('🔑 Тестовый аккаунт 2: user2 / test456');
    console.log('📝 Тестовый пост ID: 1 (уже с лайком)');
    console.log('📺 Тестовый канал: testchannel');
    console.log('========================================');
})();

class AccountManager {
    constructor(id) {
        if (!id || typeof id !== 'number' || id <= 0) {
            throw new AppError('Некорректный идентификатор аккаунта');
        }
        
        this.accountID = id;
        
        // Проверяем существование аккаунта
        if (!memoryStorage.accounts.has(id)) {
            throw new AppError('Аккаунт не найден');
        }
        
        this.accountData = memoryStorage.accounts.get(id);
    }

    // ========== СТАТИЧЕСКИЕ МЕТОДЫ ДЛЯ РАБОТЫ С ПАМЯТЬЮ ==========
    
    static getStorage() {
        return memoryStorage;
    }
    
    // ========== МЕТОДЫ ДЛЯ ПОСТОВ ==========
    
    static addPost(postData) {
        const postId = memoryStorage.nextPostId++;
        const post = {
            id: postId,
            ...postData,
            date: postData.date || new Date().toISOString(),
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
    
    static getPost(postId) {
        return memoryStorage.posts.get(postId);
    }
    
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
    
    static deletePost(postId) {
        const post = memoryStorage.posts.get(postId);
        if (post) {
            post.in_trash = 1;
            post.deleted_at = new Date().toISOString();
            memoryStorage.posts.set(postId, post);
            console.log(`🗑️  Пост ${postId} перемещен в корзину`);
            return true;
        }
        return false;
    }
    
    // ========== МЕТОДЫ ДЛЯ ЛАЙКОВ ==========
    
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
            date: new Date().toISOString()
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
    
    static getUserReaction(postId, userId) {
        const key = `${postId}_${userId}`;
        const like = memoryStorage.likes.get(key);
        return like ? like.type : null;
    }
    
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
    
    static toggleLike(postId, userId) {
        const currentReaction = AccountManager.getUserReaction(postId, userId);
        
        if (currentReaction === 'like') {
            AccountManager.removeLike(postId, userId);
            return { action: 'removed', type: 'like' };
        } else if (currentReaction === 'dislike') {
            AccountManager.removeLike(postId, userId);
            AccountManager.addLike(postId, userId, 'like');
            return { action: 'switched', from: 'dislike', to: 'like' };
        } else {
            AccountManager.addLike(postId, userId, 'like');
            return { action: 'added', type: 'like' };
        }
    }
    
    static toggleDislike(postId, userId) {
        const currentReaction = AccountManager.getUserReaction(postId, userId);
        
        if (currentReaction === 'dislike') {
            AccountManager.removeLike(postId, userId);
            return { action: 'removed', type: 'dislike' };
        } else if (currentReaction === 'like') {
            AccountManager.removeLike(postId, userId);
            AccountManager.addLike(postId, userId, 'dislike');
            return { action: 'switched', from: 'like', to: 'dislike' };
        } else {
            AccountManager.addLike(postId, userId, 'dislike');
            return { action: 'added', type: 'dislike' };
        }
    }
    
    // ========== МЕТОДЫ ДЛЯ КАНАЛОВ ==========
    
    static createChannel(channelData) {
        const channelId = memoryStorage.nextChannelId++;
        const channel = {
            ID: channelId,
            ...channelData,
            CreateDate: new Date().toISOString(),
            Avatar: null,
            Cover: null,
            Subscribers: 0,
            Posts: 0
        };
        memoryStorage.channels.set(channelId, channel);
        console.log(`📺 Канал создан: ${channelData.Name} (ID: ${channelId})`);
        return channelId;
    }
    
    static getChannel(channelId) {
        return memoryStorage.channels.get(channelId);
    }
    
    static getChannelsByOwner(ownerId) {
        const channels = [];
        for (const [id, channel] of memoryStorage.channels.entries()) {
            if (channel.Owner === ownerId) {
                channels.push({ id, ...channel });
            }
        }
        return channels;
    }
    
    static updateChannel(channelId, updates) {
        const channel = memoryStorage.channels.get(channelId);
        if (channel) {
            const updatedChannel = { ...channel, ...updates };
            memoryStorage.channels.set(channelId, updatedChannel);
            console.log(`✏️  Канал ${channelId} обновлен`);
            return true;
        }
        return false;
    }
    
    // ========== МЕТОДЫ ДЛЯ ФАЙЛОВ И ИЗОБРАЖЕНИЙ ==========
    
    static addFile(fileData) {
        const fileId = memoryStorage.nextFileId++;
        const file = {
            id: fileId,
            ...fileData,
            uploaded_at: new Date().toISOString()
        };
        memoryStorage.files.set(fileId, file);
        return fileId;
    }
    
    static getFile(fileId) {
        return memoryStorage.files.get(fileId);
    }
    
    static addImage(imageData) {
        const imageId = memoryStorage.nextImageId++;
        const image = {
            id: imageId,
            ...imageData,
            uploaded_at: new Date().toISOString()
        };
        memoryStorage.images.set(imageId, image);
        return imageId;
    }
    
    static getImage(imageId) {
        return memoryStorage.images.get(imageId);
    }
    
    static updateUserAvatar(userId, avatarData) {
        const account = memoryStorage.accounts.get(userId);
        if (account) {
            account.Avatar = avatarData;
            memoryStorage.accounts.set(userId, account);
            console.log(`🖼️  Аватар обновлен для пользователя ${userId}`);
            return true;
        }
        return false;
    }
    
    static updateUserCover(userId, coverData) {
        const account = memoryStorage.accounts.get(userId);
        if (account) {
            account.Cover = coverData;
            memoryStorage.accounts.set(userId, account);
            console.log(`🖼️  Обложка обновлена для пользователя ${userId}`);
            return true;
        }
        return false;
    }
    
    // ========== МЕТОДЫ ДЛЯ ПОДПИСОК И БЛОКИРОВОК ==========
    
    static addSubscription(userId, targetId, targetType) {
        const key = `${userId}_${targetId}_${targetType}`;
        
        if (!memoryStorage.subscriptions.has(key)) {
            memoryStorage.subscriptions.set(key, {
                userId,
                targetId,
                targetType,
                date: new Date().toISOString()
            });
            
            // Обновляем счетчик подписчиков
            if (targetType === 0) {
                const account = memoryStorage.accounts.get(targetId);
                if (account) {
                    // Можно добавить счетчик подписчиков к аккаунту
                }
            } else if (targetType === 1) {
                const channel = memoryStorage.channels.get(targetId);
                if (channel) {
                    channel.Subscribers = (channel.Subscribers || 0) + 1;
                    memoryStorage.channels.set(targetId, channel);
                }
            }
            
            console.log(`📌 Подписка добавлена: ${userId} → ${targetType === 0 ? 'пользователь' : 'канал'} ${targetId}`);
            return true;
        }
        return false;
    }
    
    static removeSubscription(userId, targetId, targetType) {
        const key = `${userId}_${targetId}_${targetType}`;
        
        if (memoryStorage.subscriptions.has(key)) {
            memoryStorage.subscriptions.delete(key);
            
            // Обновляем счетчик подписчиков
            if (targetType === 1) {
                const channel = memoryStorage.channels.get(targetId);
                if (channel && channel.Subscribers > 0) {
                    channel.Subscribers -= 1;
                    memoryStorage.channels.set(targetId, channel);
                }
            }
            
            console.log(`📌 Подписка удалена: ${userId} → ${targetType === 0 ? 'пользователь' : 'канал'} ${targetId}`);
            return true;
        }
        return false;
    }
    
    static isSubscribed(userId, targetId, targetType) {
        const key = `${userId}_${targetId}_${targetType}`;
        return memoryStorage.subscriptions.has(key);
    }
    
    static addBlock(userId, authorId, authorType) {
        const key = `${userId}_${authorId}_${authorType}`;
        
        if (!memoryStorage.blocks.has(key)) {
            memoryStorage.blocks.set(key, {
                userId,
                authorId,
                authorType,
                date: new Date().toISOString()
            });
            console.log(`🚫 Блокировка добавлена: ${userId} → ${authorType === 0 ? 'пользователь' : 'канал'} ${authorId}`);
            return true;
        }
        return false;
    }
    
    static removeBlock(userId, authorId, authorType) {
        const key = `${userId}_${authorId}_${authorType}`;
        
        if (memoryStorage.blocks.has(key)) {
            memoryStorage.blocks.delete(key);
            console.log(`🚫 Блокировка удалена: ${userId} → ${authorType === 0 ? 'пользователь' : 'канал'} ${authorId}`);
            return true;
        }
        return false;
    }
    
    static isBlocked(userId, authorId, authorType) {
        const key = `${userId}_${authorId}_${authorType}`;
        return memoryStorage.blocks.has(key);
    }
    
    // ========== МЕТОДЫ ДЛЯ УВЕДОМЛЕНИЙ ==========
    
    static addNotification(notificationData) {
        const notificationId = memoryStorage.nextNotificationId++;
        const notification = {
            id: notificationId,
            ...notificationData,
            created_at: new Date().toISOString(),
            viewed: 0
        };
        memoryStorage.notifications.set(notificationId, notification);
        return notificationId;
    }
    
    static getUserNotifications(userId) {
        const notifications = [];
        for (const [id, notification] of memoryStorage.notifications.entries()) {
            if (notification.user_id === userId) {
                notifications.push({ id, ...notification });
            }
        }
        return notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    static markNotificationAsViewed(notificationId) {
        const notification = memoryStorage.notifications.get(notificationId);
        if (notification) {
            notification.viewed = 1;
            memoryStorage.notifications.set(notificationId, notification);
            return true;
        }
        return false;
    }
    
    // ========== ОСНОВНЫЕ МЕТОДЫ АККАУНТА ==========

    static async connectAccount(loginData) {
        console.log(`[AccountManager] connectAccount вызван:`, {
            email: loginData.email?.substring(0, 10) + '...',
            username: loginData.username,
            hasPassword: !!loginData.password
        });
        
        try {
            const { email, username, password, device = 'unknown' } = loginData;
            
            if (!password) {
                throw new AppError('Пароль обязателен');
            }
            
            // Ищем аккаунт
            let foundAccount = null;
            let accountId = null;
            
            for (const [id, account] of memoryStorage.accounts.entries()) {
                if ((email && account.Email === email) || 
                    (username && account.Username === username)) {
                    foundAccount = account;
                    accountId = id;
                    break;
                }
            }
            
            // Автосоздание аккаунта для разработки
            if (!foundAccount) {
                console.log(`⚠️  Аккаунт не найден, создаем новый`);
                accountId = memoryStorage.nextAccountId++;
                const hashedPassword = await bcrypt.hash(password, 10);
                
                foundAccount = {
                    ID: accountId,
                    Name: username || email?.split('@')[0] || 'Пользователь',
                    Username: username || `user${accountId}`,
                    Email: email || `${username || `user${accountId}`}@example.com`,
                    Password: hashedPassword,
                    CreateDate: new Date().toISOString(),
                    Avatar: null,
                    Cover: null,
                    Description: 'Автосозданный аккаунт',
                    Eballs: 500,
                    Notifications: 0,
                    messenger_size: 0,
                    Posts: 0,
                    last_post: null
                };
                
                memoryStorage.accounts.set(accountId, foundAccount);
                memoryStorage.permissions.set(accountId, {
                    UserID: accountId,
                    Posts: true,
                    Comments: true,
                    NewChats: true,
                    MusicUpload: true,
                    Admin: false,
                    Verified: false,
                    Fake: false
                });
                
                console.log(`✅ Аккаунт создан автоматически: ${foundAccount.Username} (ID: ${accountId})`);
            }
            
            // Проверяем пароль
            const passwordMatch = await bcrypt.compare(password, foundAccount.Password);
            
            if (!passwordMatch) {
                throw new AppError('Неверный логин или пароль');
            }
            
            // Создаем сессию
            const sessionKey = crypto.randomBytes(32).toString('hex');
            const session = {
                uid: accountId,
                s_key: sessionKey,
                device_type: 1,
                device: device,
                create_date: new Date().toISOString(),
                aesKey: 'mock_aes_key_for_testing',
                mesKey: 'mock_mes_key_for_testing',
                connection: null,
                lastActive: new Date().toISOString()
            };
            
            memoryStorage.sessions.set(sessionKey, session);
            
            console.log(`✅ Авторизация успешна: ${foundAccount.Username} (ID: ${accountId})`);
            
            return {
                status: 'success',
                account: {
                    ID: accountId,
                    Name: foundAccount.Name,
                    Username: foundAccount.Username,
                    Email: foundAccount.Email,
                    Avatar: foundAccount.Avatar,
                    Cover: foundAccount.Cover,
                    Description: foundAccount.Description,
                    Eballs: foundAccount.Eballs,
                    Notifications: foundAccount.Notifications,
                    CreateDate: foundAccount.CreateDate
                },
                session: {
                    s_key: sessionKey,
                    aesKey: session.aesKey,
                    mesKey: session.mesKey,
                    device_type: session.device_type,
                    device: session.device
                },
                permissions: memoryStorage.permissions.get(accountId) || {
                    Posts: true,
                    Comments: true,
                    NewChats: true,
                    MusicUpload: false,
                    Admin: false,
                    Verified: false,
                    Fake: false
                }
            };
            
        } catch (error) {
            console.error('[AccountManager] Ошибка в connectAccount:', error.message);
            throw error;
        }
    }

    // Получение экземпляра AccountManager
    static getInstance(id) {
        return new AccountManager(id);
    }

    // Обновление полей аккаунта
    static async updateAccount(params) {
        console.log(`[AccountManager] updateAccount вызван с параметрами:`, params);
        
        try {
            const { id, value, data } = params;
            
            if (!id || !value || data === undefined) {
                throw new AppError('Неверные параметры для updateAccount');
            }
            
            const accManager = AccountManager.getInstance(id);
            const updates = {};
            updates[value] = data;
            
            const result = await accManager.updateAccountData(updates);
            
            console.log(`✅ Поле ${value} аккаунта ${id} обновлено`);
            return result;
        } catch (error) {
            console.error('[AccountManager] Ошибка в updateAccount:', error.message);
            return false;
        }
    }

    // Обновление сессии
    static async updateSession(sessionKeyOrId, updates) {
        console.log(`[AccountManager] updateSession вызван:`, { sessionKeyOrId, updates });
        
        try {
            let actualSessionKey, actualUpdates;
            
            if (arguments.length === 2) {
                actualSessionKey = sessionKeyOrId;
                actualUpdates = updates;
            } else if (arguments.length === 1 && typeof sessionKeyOrId === 'object') {
                actualSessionKey = sessionKeyOrId.sessionKey;
                actualUpdates = sessionKeyOrId.updates;
            } else {
                console.warn('[AccountManager] updateSession: неверные параметры');
                return false;
            }
            
            if (!actualSessionKey) {
                console.warn('[AccountManager] updateSession: отсутствует sessionKey');
                return false;
            }
            
            // Если sessionKey - число (ID пользователя), ищем его сессию
            let targetSessionKey = actualSessionKey;
            if (typeof actualSessionKey === 'number') {
                for (const [sKey, session] of memoryStorage.sessions.entries()) {
                    if (session.uid === actualSessionKey) {
                        targetSessionKey = sKey;
                        break;
                    }
                }
                
                if (typeof targetSessionKey === 'number') {
                    targetSessionKey = `user_${actualSessionKey}_${Date.now()}`;
                }
            }
            
            // Обновляем сессию
            if (typeof targetSessionKey === 'string') {
                if (memoryStorage.sessions.has(targetSessionKey)) {
                    const session = memoryStorage.sessions.get(targetSessionKey);
                    
                    if (actualUpdates) {
                        Object.assign(session, actualUpdates);
                        memoryStorage.sessions.set(targetSessionKey, session);
                        session.lastActive = new Date().toISOString();
                        
                        console.log(`✅ Сессия ${targetSessionKey.substring(0, 10)}... обновлена`);
                    }
                    
                    return true;
                } else {
                    // Создаем новую сессию
                    console.log(`⚠️  Сессия не найдена, создаем новую`);
                    
                    const newSession = {
                        uid: typeof actualSessionKey === 'number' ? actualSessionKey : 1,
                        s_key: targetSessionKey,
                        device_type: 1,
                        device: 'websocket',
                        create_date: new Date().toISOString(),
                        aesKey: 'mock_aes_key_for_testing',
                        mesKey: 'mock_mes_key_for_testing',
                        connection: null,
                        lastActive: new Date().toISOString()
                    };
                    
                    if (actualUpdates) {
                        Object.assign(newSession, actualUpdates);
                    }
                    
                    memoryStorage.sessions.set(targetSessionKey, newSession);
                    
                    console.log(`✅ Новая сессия создана: ${targetSessionKey.substring(0, 10)}...`);
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('[AccountManager] Ошибка в updateSession:', error.message);
            return false;
        }
    }

    // Создание сессии
    async startSession(deviceType, device) {
        const S_KEY = crypto.randomBytes(32).toString('hex');
        
        const session = {
            uid: this.accountID,
            s_key: S_KEY,
            device_type: deviceType === 'browser' ? 1 : 0,
            device: device || 'unknown',
            create_date: new Date().toISOString(),
            aesKey: 'mock_aes_key_for_testing',
            mesKey: 'mock_mes_key_for_testing',
            connection: null,
            lastActive: new Date().toISOString()
        };

        memoryStorage.sessions.set(S_KEY, session);
        
        console.log(`✅ Сессия создана для аккаунта ${this.accountID}: ${S_KEY.substring(0, 10)}...`);
        return S_KEY;
    }

    // Проверка пароля
    async verifyPassword(password) {
        if (!this.accountData) {
            throw new AppError('Данные аккаунта не загружены');
        }

        return await bcrypt.compare(password, this.accountData.Password);
    }

    // Получение данных аккаунта
    async getAccountData() {
        const { Password, ...safeData } = this.accountData;
        return safeData;
    }

    // Получение полных данных
    async getFullAccountData() {
        return this.accountData;
    }

    // Получение permissions
    async getPermissions() {
        return memoryStorage.permissions.get(this.accountID) || {
            Posts: true,
            Comments: true,
            NewChats: true,
            MusicUpload: false,
            Admin: false,
            Verified: false,
            Fake: false
        };
    }

    // Обновление данных аккаунта
    async updateAccountData(updates) {
        const updatedAccount = { ...this.accountData, ...updates };
        memoryStorage.accounts.set(this.accountID, updatedAccount);
        this.accountData = updatedAccount;
        
        console.log(`✅ Данные аккаунта ${this.accountID} обновлены`);
        return true;
    }

    // Получение сессии
    static async getSession(sessionKey) {
        console.log(`🔍 Поиск сессии: ${sessionKey}`);
        
        // Если sessionKey - число (userID)
        if (typeof sessionKey === 'number') {
            for (const [sKey, session] of memoryStorage.sessions.entries()) {
                if (session.uid === sessionKey) {
                    console.log(`✅ Сессия найдена для пользователя ${sessionKey}`);
                    return {
                        ID: session.uid,
                        uid: session.uid,
                        s_key: sKey,
                        aesKey: session.aesKey || 'mock_aes_key',
                        mesKey: session.mesKey || 'mock_mes_key',
                        connection: session.connection || null,
                        device_type: session.device_type,
                        device: session.device,
                        create_date: session.create_date,
                        lastActive: session.lastActive || session.create_date,
                        messenger_size: 0
                    };
                }
            }
        } 
        // Если sessionKey - строка (S_KEY)
        else if (typeof sessionKey === 'string') {
            const session = memoryStorage.sessions.get(sessionKey);
            if (session) {
                console.log(`✅ Сессия найдена по ключу: ${sessionKey.substring(0, 10)}...`);
                return {
                    ID: session.uid,
                    uid: session.uid,
                    s_key: sessionKey,
                    aesKey: session.aesKey || 'mock_aes_key',
                    mesKey: session.mesKey || 'mock_mes_key',
                    connection: session.connection || null,
                    device_type: session.device_type,
                    device: session.device,
                    create_date: session.create_date,
                    lastActive: session.lastActive || session.create_date,
                    messenger_size: 0
                };
            }
        }
        
        console.log(`❌ Сессия не найдена: ${sessionKey}`);
        
        // Возвращаем фиктивную сессию
        return {
            ID: typeof sessionKey === 'number' ? sessionKey : 1,
            uid: typeof sessionKey === 'number' ? sessionKey : 1,
            s_key: typeof sessionKey === 'string' ? sessionKey : 'mock_session_key',
            aesKey: 'mock_aes_key_for_testing',
            mesKey: 'mock_mes_key_for_testing',
            connection: null,
            device_type: 1,
            device: 'unknown',
            create_date: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            messenger_size: 0
        };
    }

    // Отправка сообщения пользователю
    static async sendMessageToUser(params, message) {
        let userId, actualMessage;
        
        if (typeof params === 'object' && params.uid !== undefined) {
            userId = params.uid;
            actualMessage = params.message;
        } else if (typeof params === 'number') {
            userId = params;
            actualMessage = message;
        } else {
            console.log('❌ Неверные параметры для sendMessageToUser:', params);
            return { success: false };
        }
        
        console.log(`📨 sendMessageToUser заглушка: user=${userId}, type=${actualMessage?.type || 'unknown'}`);
        
        return { 
            success: true, 
            message: 'Сообщение отправлено (режим заглушки)',
            userId: userId
        };
    }

    // Получение всех сессий пользователя
    static async getUserSessions(userId) {
        console.log(`🔍 getUserSessions для пользователя: ${userId}`);
        
        const sessions = [];
        for (const [sKey, session] of memoryStorage.sessions.entries()) {
            if (session.uid === userId) {
                sessions.push({
                    s_key: sKey,
                    device_type: session.device_type,
                    device: session.device,
                    create_date: session.create_date,
                    lastActive: session.lastActive || session.create_date
                });
            }
        }
        
        console.log(`✅ Найдено ${sessions.length} сессий для пользователя ${userId}`);
        return sessions;
    }

    // Удаление сессии
    static async deleteSession(sessionKey) {
        const deleted = memoryStorage.sessions.delete(sessionKey);
        if (deleted) {
            console.log(`🗑️  Сессия удалена: ${sessionKey.substring(0, 10)}...`);
        }
        return deleted;
    }

    // Получение сессии по connection ID
    static async getSessionByConnection(connectionId) {
        console.log(`🔍 Поиск сессии по connection: ${connectionId}`);
        
        for (const [sKey, session] of memoryStorage.sessions.entries()) {
            if (session.connection && session.connection.id === connectionId) {
                console.log(`✅ Сессия найдена по connection ${connectionId}`);
                return {
                    ID: session.uid,
                    uid: session.uid,
                    s_key: sKey,
                    aesKey: session.aesKey || 'mock_aes_key',
                    mesKey: session.mesKey || 'mock_mes_key',
                    connection: session.connection,
                    device_type: session.device_type,
                    device: session.device,
                    create_date: session.create_date,
                    lastActive: session.lastActive || session.create_date,
                    messenger_size: 0
                };
            }
        }
        
        console.log(`❌ Сессия по connection ${connectionId} не найдена`);
        return null;
    }

    // Получение информации об аккаунте
    static async getAccountInfo(userId) {
        console.log(`🔍 getAccountInfo для пользователя: ${userId}`);
        
        if (!memoryStorage.accounts.has(userId)) {
            console.log(`❌ Аккаунт не найден: ${userId}`);
            return null;
        }
        
        const account = memoryStorage.accounts.get(userId);
        const { Password, ...safeData } = account;
        
        return {
            ...safeData,
            permissions: memoryStorage.permissions.get(userId) || {
                Posts: true,
                Comments: true,
                NewChats: true,
                MusicUpload: false,
                Admin: false,
                Verified: false,
                Fake: false
            }
        };
    }

    // Обновление информации об аккаунте
    static async updateAccountInfo(userId, updates) {
        console.log(`🔧 updateAccountInfo для пользователя ${userId}:`, updates);
        
        if (!memoryStorage.accounts.has(userId)) {
            console.log(`❌ Аккаунт не найден: ${userId}`);
            return false;
        }
        
        const account = memoryStorage.accounts.get(userId);
        const updatedAccount = { ...account, ...updates };
        memoryStorage.accounts.set(userId, updatedAccount);
        
        console.log(`✅ Информация аккаунта ${userId} обновлена`);
        return true;
    }

    // ========== МЕТОДЫ ДЛЯ ДРУГИХ СЕРВИСОВ ==========

    async getGoldStatus() { 
        return { activated: false, date_get: null };
    }
    
    async getGoldHistory() { 
        return []; 
    }
    
    async getChannels() { 
        return AccountManager.getChannelsByOwner(this.accountID);
    }
    
    async getMessengerNotifications() { 
        return AccountManager.getUserNotifications(this.accountID).length;
    }
    
    async changeAvatar(avatar) { 
        console.log(`📦 changeAvatar для аккаунта ${this.accountID}`);
        const avatarId = AccountManager.addImage({
            user_id: this.accountID,
            type: 'avatar',
            data: avatar,
            size: avatar?.size || 0,
            mime_type: avatar?.type || 'image/jpeg'
        });
        
        const avatarData = {
            id: avatarId,
            url: `/uploads/avatars/${avatarId}.jpg`,
            size: avatar?.size || 0,
            uploaded_at: new Date().toISOString()
        };
        
        AccountManager.updateUserAvatar(this.accountID, avatarData);
        return { status: 'success', avatar: avatarData }; 
    }
    
    async changeCover(cover) { 
        console.log(`📦 changeCover для аккаунта ${this.accountID}`);
        const coverId = AccountManager.addImage({
            user_id: this.accountID,
            type: 'cover',
            data: cover,
            size: cover?.size || 0,
            mime_type: cover?.type || 'image/jpeg'
        });
        
        const coverData = {
            id: coverId,
            url: `/uploads/covers/${coverId}.jpg`,
            size: cover?.size || 0,
            uploaded_at: new Date().toISOString()
        };
        
        AccountManager.updateUserCover(this.accountID, coverData);
        return { status: 'success', cover: coverData }; 
    }
    
    async changeName(name) { 
        console.log(`📦 changeName: ${name}`);
        await this.updateAccountData({ Name: name });
        return { status: 'success' }; 
    }
    
    async changeUsername(username) { 
        console.log(`📦 changeUsername: ${username}`);
        await this.updateAccountData({ Username: username });
        return { status: 'success' }; 
    }
    
    async changeDescription(description) { 
        console.log(`📦 changeDescription: ${description}`);
        await this.updateAccountData({ Description: description });
        return { status: 'success' }; 
    }
    
    async changeEmail(email) { 
        console.log(`📦 changeEmail: ${email}`);
        await this.updateAccountData({ Email: email });
        return { status: 'success' }; 
    }
    
    async changePassword(password) { 
        console.log(`📦 changePassword для аккаунта ${this.accountID}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.updateAccountData({ Password: hashedPassword });
        return { status: 'success' }; 
    }
    
    async addEballs(count) { 
        console.log(`📦 addEballs: ${count} eballs`);
        const currentEballs = this.accountData.Eballs || 0;
        await this.updateAccountData({ Eballs: currentEballs + count });
        return; 
    }
    
    async maybeReward(type) { 
        console.log(`📦 maybeReward: ${type}`);
        const rewards = {
            post: 5,
            comment: 2,
            song: 10
        };
        
        if (rewards[type]) {
            await this.addEballs(rewards[type]);
            console.log(`🎁 Награда за ${type}: +${rewards[type]} eballs`);
        }
        return; 
    }

    // Получение аккаунта по email или username
    static async getAccountByEmailOrUsername(identifier) {
        console.log(`🔍 Поиск аккаунта: ${identifier}`);
        
        for (const [id, account] of memoryStorage.accounts.entries()) {
            if (account.Email === identifier || account.Username === identifier) {
                console.log(`✅ Аккаунт найден: ${account.Username} (ID: ${id})`);
                return {
                    ID: id,
                    Name: account.Name,
                    Username: account.Username,
                    Email: account.Email,
                    Password: account.Password,
                    CreateDate: account.CreateDate,
                    Avatar: account.Avatar,
                    Cover: account.Cover,
                    Description: account.Description,
                    Eballs: account.Eballs,
                    Notifications: account.Notifications
                };
            }
        }
        
        console.log(`❌ Аккаунт не найден: ${identifier}`);
        return null;
    }

    // Выход из аккаунта
    static async logout(sessionKey) {
        console.log(`[AccountManager] logout для сессии: ${typeof sessionKey === 'string' ? sessionKey.substring(0, 10) + '...' : sessionKey}`);
        
        if (typeof sessionKey === 'string') {
            const deleted = memoryStorage.sessions.delete(sessionKey);
            if (deleted) {
                console.log(`✅ Сессия удалена при выходе`);
                return true;
            }
        }
        
        return true;
    }

    // Проверка токена
    static async validateToken(token) {
        console.log(`[AccountManager] validateToken: ${token?.substring(0, 10)}...`);
        
        if (typeof token === 'string' && memoryStorage.sessions.has(token)) {
            const session = memoryStorage.sessions.get(token);
            return {
                valid: true,
                userId: session.uid,
                session: session
            };
        }
        
        if (typeof token === 'number' && memoryStorage.accounts.has(token)) {
            return {
                valid: true,
                userId: token,
                session: null
            };
        }
        
        return {
            valid: false,
            userId: null,
            session: null
        };
    }

    // Упрощенная авторизация
    static async simpleAuth(credentials) {
        console.log(`[AccountManager] simpleAuth:`, credentials);
        
        const testAccount = memoryStorage.accounts.get(1);
        const sessionKey = crypto.randomBytes(32).toString('hex');
        
        const session = {
            uid: 1,
            s_key: sessionKey,
            device_type: 1,
            device: 'web',
            create_date: new Date().toISOString(),
            aesKey: 'test_aes_key',
            mesKey: 'test_mes_key',
            connection: null,
            lastActive: new Date().toISOString()
        };
        
        memoryStorage.sessions.set(sessionKey, session);
        
        return {
            status: 'success',
            account: {
                ID: 1,
                Name: testAccount.Name,
                Username: testAccount.Username,
                Email: testAccount.Email,
                Avatar: testAccount.Avatar,
                Cover: testAccount.Cover,
                Description: testAccount.Description,
                Eballs: testAccount.Eballs,
                Notifications: testAccount.Notifications,
                CreateDate: testAccount.CreateDate
            },
            session: {
                s_key: sessionKey,
                aesKey: session.aesKey,
                mesKey: session.mesKey,
                device_type: session.device_type,
                device: session.device
            },
            permissions: memoryStorage.permissions.get(1)
        };
    }

    // Универсальный обработчик
    static async __missingFunction(name, ...args) {
        console.log(`⚠️  [AccountManager] Вызвана отсутствующая функция: ${name} с аргументами:`, args);
        return null;
    }
}

// ========== ЭКСПОРТЫ ДЛЯ ДРУГИХ МОДУЛЕЙ ==========

// Основные методы AccountManager
export const getSession = AccountManager.getSession;
export const sendMessageToUser = AccountManager.sendMessageToUser;
export const getUserSessions = AccountManager.getUserSessions;
export const getSessions = AccountManager.getSessions;
export const deleteSession = AccountManager.deleteSession;
export const createAccount = AccountManager.createAccount;
export const getInstance = AccountManager.getInstance;
export const updateAccount = AccountManager.updateAccount;
export const updateSession = AccountManager.updateSession;
export const getSessionByConnection = AccountManager.getSessionByConnection;
export const getAccountByEmailOrUsername = AccountManager.getAccountByEmailOrUsername;
export const connectAccount = AccountManager.connectAccount;
export const logout = AccountManager.logout;
export const validateToken = AccountManager.validateToken;
export const getAccountInfo = AccountManager.getAccountInfo;
export const updateAccountInfo = AccountManager.updateAccountInfo;
export const simpleAuth = AccountManager.simpleAuth;

// Методы для работы с хранилищем
export const getMemoryStorage = () => memoryStorage;

// Методы для постов
export const addPost = AccountManager.addPost;
export const getPost = AccountManager.getPost;
export const getPostsByAuthor = AccountManager.getPostsByAuthor;
export const updatePost = AccountManager.updatePost;
export const deletePost = AccountManager.deletePost;

// Методы для лайков
export const addLike = AccountManager.addLike;
export const removeLike = AccountManager.removeLike;
export const getUserReaction = AccountManager.getUserReaction;
export const getPostStats = AccountManager.getPostStats;
export const toggleLike = AccountManager.toggleLike;
export const toggleDislike = AccountManager.toggleDislike;

// Методы для каналов
export const createChannel = AccountManager.createChannel;
export const getChannel = AccountManager.getChannel;
export const getChannelsByOwner = AccountManager.getChannelsByOwner;
export const updateChannel = AccountManager.updateChannel;

// Методы для файлов и изображений
export const addFile = AccountManager.addFile;
export const getFile = AccountManager.getFile;
export const addImage = AccountManager.addImage;
export const getImage = AccountManager.getImage;
export const updateUserAvatar = AccountManager.updateUserAvatar;
export const updateUserCover = AccountManager.updateUserCover;

// Методы для подписок и блокировок
export const addSubscription = AccountManager.addSubscription;
export const removeSubscription = AccountManager.removeSubscription;
export const isSubscribed = AccountManager.isSubscribed;
export const addBlock = AccountManager.addBlock;
export const removeBlock = AccountManager.removeBlock;
export const isBlocked = AccountManager.isBlocked;

// Методы для уведомлений
export const addNotification = AccountManager.addNotification;
export const getUserNotifications = AccountManager.getUserNotifications;
export const markNotificationAsViewed = AccountManager.markNotificationAsViewed;

// Экспорт для отладки
export const debugMemory = () => ({
    totalAccounts: memoryStorage.accounts.size,
    totalSessions: memoryStorage.sessions.size,
    totalPosts: memoryStorage.posts.size,
    totalChannels: memoryStorage.channels.size,
    totalLikes: memoryStorage.likes.size,
    totalImages: memoryStorage.images.size,
    totalFiles: memoryStorage.files.size,
    totalSubscriptions: memoryStorage.subscriptions.size,
    totalBlocks: memoryStorage.blocks.size,
    totalNotifications: memoryStorage.notifications.size,
    
    nextIds: {
        account: memoryStorage.nextAccountId,
        post: memoryStorage.nextPostId,
        song: memoryStorage.nextSongId,
        channel: memoryStorage.nextChannelId,
        image: memoryStorage.nextImageId,
        file: memoryStorage.nextFileId,
        comment: memoryStorage.nextCommentId,
        like: memoryStorage.nextLikeId,
        notification: memoryStorage.nextNotificationId,
        message: memoryStorage.nextMessageId,
        gift: memoryStorage.nextGiftId,
        report: memoryStorage.nextReportId,
        appeal: memoryStorage.nextAppealId,
        punishment: memoryStorage.nextPunishmentId
    },
    
    accounts: Array.from(memoryStorage.accounts.entries()).map(([id, acc]) => ({
        ID: id,
        Username: acc.Username,
        Email: acc.Email,
        Name: acc.Name,
        Posts: acc.Posts || 0,
        Eballs: acc.Eballs || 0,
        Avatar: acc.Avatar ? 'есть' : 'нет',
        Cover: acc.Cover ? 'есть' : 'нет'
    })),
    
    posts: Array.from(memoryStorage.posts.entries()).map(([id, post]) => ({
        ID: id,
        author: `${post.author_type === 0 ? 'пользователь' : 'канал'} ${post.author_id}`,
        text: post.text?.substring(0, 30) + (post.text?.length > 30 ? '...' : ''),
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        date: post.date
    })),
    
    likesSummary: {
        totalLikes: memoryStorage.likes.size,
        likesByType: {
            like: Array.from(memoryStorage.likes.values()).filter(l => l.type === 'like').length,
            dislike: Array.from(memoryStorage.likes.values()).filter(l => l.type === 'dislike').length
        }
    }
});

// Экспорт класса как default
export default AccountManager;
