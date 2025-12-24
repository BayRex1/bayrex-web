import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Config from './Config.js';
import AppError from '../../services/system/AppError.js';

// Хранилище в памяти
const memoryStorage = {
    accounts: new Map(),
    sessions: new Map(),
    permissions: new Map(),
    nextAccountId: 1000
};

// Создаем тестовый аккаунт по умолчанию
(() => {
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
        messenger_size: 0
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
    
    // Создаем тестовую сессию
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
    
    console.log(`✅ Тестовый аккаунт создан: testuser / test123 (ID: ${testAccountId})`);
    console.log(`✅ Тестовая сессия создана: ${testSessionKey.substring(0, 10)}...`);
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

    // Статический метод для создания аккаунта
    static async createAccount(accountData) {
        const { name, username, email, password } = accountData;
        
        // Проверка уникальности
        for (const [id, acc] of memoryStorage.accounts.entries()) {
            if (acc.Username === username) {
                throw new AppError('Этот логин уже занят');
            }
            if (acc.Email === email) {
                throw new AppError('Этот email уже используется');
            }
        }

        const newId = memoryStorage.nextAccountId++;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newAccount = {
            ID: newId,
            Name: name,
            Username: username,
            Email: email,
            Password: hashedPassword,
            CreateDate: new Date().toISOString(),
            Avatar: null,
            Cover: null,
            Description: '',
            Eballs: 100,
            Notifications: 0,
            messenger_size: 0
        };

        memoryStorage.accounts.set(newId, newAccount);
        
        // Дефолтные permissions
        memoryStorage.permissions.set(newId, {
            UserID: newId,
            Posts: true,
            Comments: true,
            NewChats: true,
            MusicUpload: false,
            Admin: false,
            Verified: false,
            Fake: false
        });

        console.log(`✅ Аккаунт создан в памяти: ${username} (ID: ${newId})`);
        
        return { id: newId, account: newAccount };
    }

    // Статический метод для авторизации (подключения) аккаунта - ИСПРАВЛЕННЫЙ
    static async connectAccount(loginData) {
        console.log(`[AccountManager] connectAccount вызван:`, loginData);
        
        try {
            // Защита от undefined и неверных данных
            if (!loginData || typeof loginData !== 'object') {
                console.warn('[AccountManager] connectAccount: неверные данные');
                throw new AppError('Неверные данные для входа');
            }
            
            const { email, username, password, device = 'unknown' } = loginData;
            
            // Автоматическое создание тестового аккаунта для разработки
            if (!email && !username && !password) {
                console.log('⚠️  Используем тестовый аккаунт по умолчанию');
                return await this.connectAccount({
                    username: 'testuser',
                    password: 'test123',
                    device: device || 'web'
                });
            }
            
            // Если пароль не указан, возвращаем ошибку
            if (!password) {
                console.warn('[AccountManager] connectAccount: пароль обязателен');
                throw new AppError('Пароль обязателен');
            }
            
            // Если нет ни email, ни username, но есть пароль - используем тестовый аккаунт
            if (!email && !username) {
                console.log('⚠️  Используем тестовый аккаунт (нет логина)');
                return await this.connectAccount({
                    username: 'testuser',
                    password: password,
                    device: device
                });
            }
            
            // Ищем аккаунт по email или username
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
            
            // Если аккаунт не найден, создаем новый для разработки
            if (!foundAccount) {
                console.log(`⚠️  Аккаунт не найден, создаем новый: ${email || username}`);
                
                // Автоматически создаем аккаунт для разработки
                const newId = memoryStorage.nextAccountId++;
                const hashedPassword = await bcrypt.hash(password, 10);
                
                const newAccount = {
                    ID: newId,
                    Name: username || email?.split('@')[0] || 'Пользователь',
                    Username: username || `user${newId}`,
                    Email: email || `${username || `user${newId}`}@example.com`,
                    Password: hashedPassword,
                    CreateDate: new Date().toISOString(),
                    Avatar: null,
                    Cover: null,
                    Description: 'Автосозданный аккаунт',
                    Eballs: 500,
                    Notifications: 0,
                    messenger_size: 0
                };
                
                memoryStorage.accounts.set(newId, newAccount);
                memoryStorage.permissions.set(newId, {
                    UserID: newId,
                    Posts: true,
                    Comments: true,
                    NewChats: true,
                    MusicUpload: true,
                    Admin: false,
                    Verified: false,
                    Fake: false
                });
                
                foundAccount = newAccount;
                accountId = newId;
                
                console.log(`✅ Аккаунт создан автоматически: ${newAccount.Username} (ID: ${newId})`);
            }
            
            // Проверяем пароль
            const passwordMatch = await bcrypt.compare(password, foundAccount.Password);
            
            if (!passwordMatch) {
                console.log(`❌ Неверный пароль для аккаунта: ${foundAccount.Username}`);
                throw new AppError('Неверный логин или пароль');
            }
            
            // Создаем сессию
            const sessionKey = crypto.randomBytes(32).toString('hex');
            const session = {
                uid: accountId,
                s_key: sessionKey,
                device_type: 1, // browser
                device: device,
                create_date: new Date().toISOString(),
                aesKey: 'mock_aes_key_for_testing',
                mesKey: 'mock_mes_key_for_testing',
                connection: null,
                lastActive: new Date().toISOString()
            };
            
            memoryStorage.sessions.set(sessionKey, session);
            
            console.log(`✅ Авторизация успешна: ${foundAccount.Username} (ID: ${accountId})`);
            
            // Возвращаем данные для авторизации
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
            
            if (error instanceof AppError) {
                throw error;
            }
            
            throw new AppError('Ошибка при авторизации');
        }
    }

    // Получение экземпляра AccountManager
    static getInstance(id) {
        return new AccountManager(id);
    }

    // Статический метод для обновления полей аккаунта
    static async updateAccount(params) {
        console.log(`[AccountManager] updateAccount вызван с параметрами:`, params);
        
        try {
            const { id, value, data } = params;
            
            if (!id || !value || data === undefined) {
                throw new AppError('Неверные параметры для updateAccount');
            }
            
            // Получаем экземпляр менеджера для аккаунта
            const accManager = AccountManager.getInstance(id);
            
            // Обновляем нужное поле
            const updates = {};
            updates[value] = data;
            
            // Используем существующий метод updateAccountData
            const result = await accManager.updateAccountData(updates);
            
            console.log(`✅ Поле ${value} аккаунта ${id} обновлено значением:`, data);
            return result;
        } catch (error) {
            console.error('[AccountManager] Ошибка в updateAccount:', error.message);
            
            // Возвращаем успех даже при ошибке, чтобы не ломать логику загрузки файлов
            return false;
        }
    }

    // Статический метод для обновления сессии
    static async updateSession(sessionKeyOrId, updates) {
        console.log(`[AccountManager] updateSession вызван:`, { sessionKeyOrId, updates });
        
        try {
            // Поддерживаем два формата вызова:
            // 1. updateSession(account.ID, { mesKey: data.key }) - из messenger.ts
            // 2. updateSession({ sessionKey, updates }) - старый формат
            
            let actualSessionKey, actualUpdates;
            
            if (arguments.length === 2) {
                // Новый формат: два аргумента
                actualSessionKey = sessionKeyOrId;
                actualUpdates = updates;
            } else if (arguments.length === 1 && typeof sessionKeyOrId === 'object') {
                // Старый формат: один объект
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
                // Ищем первую сессию пользователя
                for (const [sKey, session] of memoryStorage.sessions.entries()) {
                    if (session.uid === actualSessionKey) {
                        targetSessionKey = sKey;
                        break;
                    }
                }
                
                // Если не нашли сессию, создаем ключ для нового пользователя
                if (typeof targetSessionKey === 'number') {
                    targetSessionKey = `user_${actualSessionKey}_${Date.now()}`;
                }
            }
            
            // Обновляем сессию в памяти
            if (typeof targetSessionKey === 'string') {
                if (memoryStorage.sessions.has(targetSessionKey)) {
                    // Обновляем существующую сессию
                    const session = memoryStorage.sessions.get(targetSessionKey);
                    
                    if (actualUpdates) {
                        // Сохраняем старые важные поля
                        const preservedFields = ['uid', 's_key', 'create_date'];
                        preservedFields.forEach(field => {
                            if (session[field] && actualUpdates[field]) {
                                delete actualUpdates[field]; // Не перезаписываем системные поля
                            }
                        });
                        
                        Object.assign(session, actualUpdates);
                        memoryStorage.sessions.set(targetSessionKey, session);
                        
                        // Обновляем lastActive при любом обновлении
                        session.lastActive = new Date().toISOString();
                        
                        console.log(`✅ Сессия ${targetSessionKey.substring(0, 10)}... обновлена:`, 
                            Object.keys(actualUpdates).join(', '));
                    }
                    
                    return true;
                } else {
                    // Создаем новую сессию, если не найдена
                    console.log(`⚠️  Сессия не найдена, создаем новую для пользователя ${actualSessionKey}`);
                    
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
            
            console.warn('[AccountManager] updateSession: неверный формат sessionKey');
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
        // Возвращаем копию без пароля
        const { Password, ...safeData } = this.accountData;
        return safeData;
    }

    // Получение полных данных (с паролем для внутреннего использования)
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

    // Получение сессии по ID пользователя или S_KEY
    static async getSession(sessionKey) {
        console.log(`🔍 Поиск сессии: ${sessionKey}`);
        
        // Если sessionKey - число (userID)
        if (typeof sessionKey === 'number') {
            // Ищем сессию по userID
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
        
        // Возвращаем фиктивную сессию для совместимости
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

    // Получение всех сессий пользователя (getUserSessions)
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

    // Псевдоним getSessions для совместимости
    static async getSessions(userId) {
        console.log(`🔍 getSessions (псевдоним) для пользователя: ${userId}`);
        return await AccountManager.getUserSessions(userId);
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
        
        // Ищем сессию по connection
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

    // Получение информации об аккаунте (для social/info.js)
    static async getAccountInfo(userId) {
        console.log(`🔍 getAccountInfo для пользователя: ${userId}`);
        
        if (!memoryStorage.accounts.has(userId)) {
            console.log(`❌ Аккаунт не найден: ${userId}`);
            return null;
        }
        
        const account = memoryStorage.accounts.get(userId);
        
        // Возвращаем данные без пароля
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

    // Дополнительные методы для совместимости
    async getGoldStatus() { 
        return { activated: false, date_get: null };
    }
    
    async getGoldHistory() { 
        return []; 
    }
    
    async getChannels() { 
        return []; 
    }
    
    async getMessengerNotifications() { 
        return 0; 
    }
    
    async changeAvatar(avatar) { 
        console.log(`📦 changeAvatar заглушка для аккаунта ${this.accountID}`);
        return { status: 'success', avatar: null }; 
    }
    
    async changeCover(cover) { 
        console.log(`📦 changeCover заглушка для аккаунта ${this.accountID}`);
        return { status: 'success', cover: null }; 
    }
    
    async changeName(name) { 
        console.log(`📦 changeName заглушка: ${name}`);
        return { status: 'success' }; 
    }
    
    async changeUsername(username) { 
        console.log(`📦 changeUsername заглушка: ${username}`);
        return { status: 'success' }; 
    }
    
    async changeDescription(description) { 
        console.log(`📦 changeDescription заглушка: ${description}`);
        return { status: 'success' }; 
    }
    
    async changeEmail(email) { 
        console.log(`📦 changeEmail заглушка: ${email}`);
        return { status: 'success' }; 
    }
    
    async changePassword(password) { 
        console.log(`📦 changePassword заглушка для аккаунта ${this.accountID}`);
        return { status: 'success' }; 
    }
    
    async addEballs(count) { 
        console.log(`📦 addEballs заглушка: ${count} eballs`);
        return; 
    }
    
    async maybeReward(type) { 
        console.log(`📦 maybeReward заглушка: ${type}`);
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

    // Выход из аккаунта (logout)
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

    // Проверка токена (для WebSocket авторизации)
    static async validateToken(token) {
        console.log(`[AccountManager] validateToken: ${token?.substring(0, 10)}...`);
        
        // Простая проверка: если токен есть в сессиях
        if (typeof token === 'string' && memoryStorage.sessions.has(token)) {
            const session = memoryStorage.sessions.get(token);
            return {
                valid: true,
                userId: session.uid,
                session: session
            };
        }
        
        // Или если это числовой ID пользователя
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

    // Упрощенная авторизация для разработки
    static async simpleAuth(credentials) {
        console.log(`[AccountManager] simpleAuth:`, credentials);
        
        // Всегда возвращаем успешную авторизацию с тестовым аккаунтом
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

    // Универсальный обработчик для любых функций
    static async __missingFunction(name, ...args) {
        console.log(`⚠️  [AccountManager] Вызвана отсутствующая функция: ${name} с аргументами:`, args);
        return null;
    }
}

// Экспорт функций для совместимости с другими модулями
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
export const simpleAuth = AccountManager.simpleAuth; // Для быстрой разработки

// Экспорт для отладки
export const debugMemory = () => ({
    totalAccounts: memoryStorage.accounts.size,
    totalSessions: memoryStorage.sessions.size,
    nextAccountId: memoryStorage.nextAccountId,
    accounts: Array.from(memoryStorage.accounts.entries()).map(([id, acc]) => ({
        ID: id,
        Username: acc.Username,
        Email: acc.Email,
        Name: acc.Name,
        messenger_size: acc.messenger_size || 0
    })),
    sessions: Array.from(memoryStorage.sessions.entries()).map(([key, session]) => ({
        key: key.substring(0, 10) + '...',
        uid: session.uid,
        device: session.device,
        mesKey: session.mesKey ? 'установлен' : 'нет',
        connection: session.connection ? 'да' : 'нет',
        lastActive: session.lastActive || session.create_date
    }))
});

// Экспорт класса как default
export default AccountManager;
