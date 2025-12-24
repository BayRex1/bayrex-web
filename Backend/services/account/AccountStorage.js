// services/account/AccountStorage.js

// Центральное хранилище в памяти
export const memoryStorage = {
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
    likes: new Map(),
    postLikes: new Map(),
    subscriptions: new Map(),
    blocks: new Map(),
    
    // Уведомления и прочее
    notifications: new Map(),
    messages: new Map(),
    gifts: new Map(),
    reports: new Map(),
    appeals: new Map(),
    punishments: new Map(),
    
    // Счетчики
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
export const initTestData = () => {
    console.log('🧪 Инициализация тестовых данных...');
    
    // Тестовый аккаунт 1
    const testAccountId = 1;
    const bcrypt = require('bcryptjs');
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
    
    // Тестовый аккаунт 2
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
    const crypto = require('crypto');
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
    
    console.log('✅ Тестовые данные созданы:');
    console.log(`   📊 Аккаунты: ${memoryStorage.accounts.size}`);
    console.log(`   📊 Сессии: ${memoryStorage.sessions.size}`);
    console.log(`   📊 Посты: ${memoryStorage.posts.size}`);
    console.log(`   📊 Лайки: ${memoryStorage.likes.size}`);
    console.log(`   📊 Каналы: ${memoryStorage.channels.size}`);
};

// Экспорт хранилища
export const getMemoryStorage = () => memoryStorage;

// Функция для отладки
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
        notification: memoryStorage.nextNotificationId
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

// Экспорт отдельных хранилищ для удобства
export const getAccounts = () => memoryStorage.accounts;
export const getSessions = () => memoryStorage.sessions;
export const getPosts = () => memoryStorage.posts;
export const getLikes = () => memoryStorage.likes;
export const getChannels = () => memoryStorage.channels;
export const getSubscriptions = () => memoryStorage.subscriptions;
export const getBlocks = () => memoryStorage.blocks;
export const getNotifications = () => memoryStorage.notifications;
