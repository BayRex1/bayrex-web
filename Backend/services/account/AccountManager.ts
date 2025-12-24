import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Config from './Config.js';
import AppError from '../../services/system/AppError.js';

// Хранилище в памяти - РАСШИРЕННАЯ ВЕРСИЯ
const memoryStorage = {
    accounts: new Map(),
    sessions: new Map(),
    permissions: new Map(),
    posts: new Map(),           // Хранилище постов
    channels: new Map(),        // Хранилище каналов
    songs: new Map(),           // Хранилище музыки
    images: new Map(),          // Хранилище изображений (аватарки, обложки)
    files: new Map(),           // Хранилище файлов
    notifications: new Map(),   // Уведомления
    comments: new Map(),        // Комментарии
    likes: new Map(),           // Лайки
    nextAccountId: 1000,
    nextPostId: 1000,
    nextSongId: 1000,
    nextChannelId: 1000,
    nextImageId: 1000,
    nextFileId: 1000,
    nextCommentId: 1000,
    nextNotificationId: 1000
};

// Создаем тестовые данные
(() => {
    const testAccountId = 1;
    const hashedPassword = bcrypt.hashSync('test123', 10);
    
    // Тестовый аккаунт
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
        Posts: 0,
        last_post: null
    });
    
    // Права доступа
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
    
    // Тестовая сессия
    const testSessionKey = 'test_session_key_' + Date.now();
    memoryStorage.sessions.set(testSessionKey, {
        uid: testAccountId,
        s_key: testSessionKey,
        device_type: 1,
        device: 'test-device',
        create_date: new Date().toISOString(),
        aesKey: 'test_aes_key',
        mesKey: 'test_mes_key',
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
        likes: 0,
        comments: 0,
        shares: 0
    });
    
    // Обновляем счетчик постов у аккаунта
    memoryStorage.accounts.get(testAccountId).Posts = 1;
    
    console.log(`✅ Тестовый аккаунт создан: testuser / test123 (ID: ${testAccountId})`);
    console.log(`✅ Тестовая сессия создана: ${testSessionKey.substring(0, 10)}...`);
    console.log(`✅ Тестовый пост создан (ID: ${testPostId})`);
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

    // ========== СТАТИЧЕСКИЕ МЕТОДЫ ДЛЯ ХРАНИЛИЩ ==========
    
    // Получение хранилища для других модулей
    static getStorage() {
        return memoryStorage;
    }
    
    // Добавление поста
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
            comments: 0,
            shares: 0
        };
        memoryStorage.posts.set(postId, post);
        console.log(`📝 Пост добавлен (ID: ${postId})`);
        return postId;
    }
    
    // Получение поста
    static getPost(postId) {
        return memoryStorage.posts.get(postId);
    }
    
    // Получение всех постов пользователя/канала
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
    
    // Добавление файла/изображения
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
    
    // Получение файла
    static getFile(fileId) {
        return memoryStorage.files.get(fileId);
    }
    
    // Добавление изображения (аватар/обложка)
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
    
    // Получение изображения
    static getImage(imageId) {
        return memoryStorage.images.get(imageId);
    }
    
    // Обновление аватара пользователя
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
    
    // Обновление обложки пользователя
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
    
    // Добавление уведомления
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
    
    // Получение уведомлений пользователя
    static getUserNotifications(userId) {
        const notifications = [];
        for (const [id, notification] of memoryStorage.notifications.entries()) {
            if (notification.user_id === userId) {
                notifications.push({ id, ...notification });
            }
        }
        return notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    // Создание канала
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
    
    // Получение канала
    static getChannel(channelId) {
        return memoryStorage.channels.get(channelId);
    }

    // ========== ОСНОВНЫЕ МЕТОДЫ АККАУНТА ==========

    // Статический метод для авторизации
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

    // Для PostManager
    async getGoldStatus() { 
        return { activated: false, date_get: null };
    }
    
    async getGoldHistory() { 
        return []; 
    }
    
    async getChannels() { 
        const channels = [];
        for (const [id, channel] of memoryStorage.channels.entries()) {
            if (channel.Owner === this.accountID) {
                channels.push({
                    id: channel.ID,
                    name: channel.Name,
                    username: channel.Username,
                    avatar: channel.Avatar,
                    cover: channel.Cover,
                    description: channel.Description,
                    subscribers: channel.Subscribers,
                    posts: channel.Posts,
                    create_date: channel.CreateDate
                });
            }
        }
        return channels;
    }
    
    async getMessengerNotifications() { 
        return 0; 
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
        // Награда за пост/комментарий/песню
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

// Экспорт для работы с хранилищем
export const getMemoryStorage = () => memoryStorage;
export const addPost = AccountManager.addPost;
export const getPost = AccountManager.getPost;
export const getPostsByAuthor = AccountManager.getPostsByAuthor;
export const addFile = AccountManager.addFile;
export const getFile = AccountManager.getFile;
export const addImage = AccountManager.addImage;
export const getImage = AccountManager.getImage;
export const updateUserAvatar = AccountManager.updateUserAvatar;
export const updateUserCover = AccountManager.updateUserCover;
export const addNotification = AccountManager.addNotification;
export const getUserNotifications = AccountManager.getUserNotifications;
export const createChannel = AccountManager.createChannel;
export const getChannel = AccountManager.getChannel;

// Экспорт для отладки
export const debugMemory = () => ({
    totalAccounts: memoryStorage.accounts.size,
    totalSessions: memoryStorage.sessions.size,
    totalPosts: memoryStorage.posts.size,
    totalChannels: memoryStorage.channels.size,
    totalImages: memoryStorage.images.size,
    totalFiles: memoryStorage.files.size,
    totalNotifications: memoryStorage.notifications.size,
    nextIds: {
        account: memoryStorage.nextAccountId,
        post: memoryStorage.nextPostId,
        song: memoryStorage.nextSongId,
        channel: memoryStorage.nextChannelId,
        image: memoryStorage.nextImageId,
        file: memoryStorage.nextFileId,
        comment: memoryStorage.nextCommentId,
        notification: memoryStorage.nextNotificationId
    },
    accounts: Array.from(memoryStorage.accounts.entries()).map(([id, acc]) => ({
        ID: id,
        Username: acc.Username,
        Email: acc.Email,
        Name: acc.Name,
        Posts: acc.Posts || 0,
        Avatar: acc.Avatar ? 'есть' : 'нет',
        Cover: acc.Cover ? 'есть' : 'нет'
    })),
    posts: Array.from(memoryStorage.posts.entries()).map(([id, post]) => ({
        ID: id,
        author: `${post.author_type === 0 ? 'пользователь' : 'канал'} ${post.author_id}`,
        text: post.text?.substring(0, 50) + (post.text?.length > 50 ? '...' : ''),
        type: post.content_type,
        date: post.date
    }))
});

// Экспорт класса как default
export default AccountManager;
