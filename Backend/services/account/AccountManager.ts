// services/account/AccountManager.js
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import AppError from '../../services/system/AppError.js';
import { memoryStorage, initTestData } from './AccountStorage.js';

// Инициализируем тестовые данные
initTestData();

class AccountManager {
    constructor(id) {
        if (!id || typeof id !== 'number' || id <= 0) {
            throw new AppError('Некорректный идентификатор аккаунта');
        }
        
        this.accountID = id;
        
        if (!memoryStorage.accounts.has(id)) {
            throw new AppError('Аккаунт не найден');
        }
        
        this.accountData = memoryStorage.accounts.get(id);
    }

    // ========== СТАТИЧЕСКИЕ МЕТОДЫ ==========

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
            
            // Автосоздание для разработки
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

    static getInstance(id) {
        return new AccountManager(id);
    }

    static async updateAccount(params) {
        console.log(`[AccountManager] updateAccount:`, params);
        
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

    static async updateSession(sessionKeyOrId, updates) {
        console.log(`[AccountManager] updateSession:`, { sessionKeyOrId, updates });
        
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

    // ========== ИНСТАНСНЫЕ МЕТОДЫ ==========

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

    async verifyPassword(password) {
        if (!this.accountData) {
            throw new AppError('Данные аккаунта не загружены');
        }

        return await bcrypt.compare(password, this.accountData.Password);
    }

    async getAccountData() {
        const { Password, ...safeData } = this.accountData;
        return safeData;
    }

    async getFullAccountData() {
        return this.accountData;
    }

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

    async updateAccountData(updates) {
        const updatedAccount = { ...this.accountData, ...updates };
        memoryStorage.accounts.set(this.accountID, updatedAccount);
        this.accountData = updatedAccount;
        
        console.log(`✅ Данные аккаунта ${this.accountID} обновлены`);
        return true;
    }

    // Методы для совместимости с другими сервисами
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
        // Реализация будет в FileManager
        return { status: 'success', avatar: null }; 
    }
    
    async changeCover(cover) { 
        console.log(`📦 changeCover для аккаунта ${this.accountID}`);
        return { status: 'success', cover: null }; 
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
}

// ========== ЭКСПОРТЫ ==========

// Основные методы AccountManager
export const connectAccount = AccountManager.connectAccount;
export const getInstance = AccountManager.getInstance;
export const updateAccount = AccountManager.updateAccount;
export const updateSession = AccountManager.updateSession;
export const getSession = AccountManager.getSession;
export const logout = AccountManager.logout;
export const getAccountInfo = AccountManager.getAccountInfo;
export const getAccountByEmailOrUsername = AccountManager.getAccountByEmailOrUsername;

// Для совместимости
export const sendMessageToUser = async (params, message) => {
    console.log(`📨 sendMessageToUser заглушка`);
    return { success: true };
};

export const getUserSessions = async (userId) => {
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
};

export const getSessions = getUserSessions;
export const deleteSession = async (sessionKey) => {
    const deleted = memoryStorage.sessions.delete(sessionKey);
    if (deleted) {
        console.log(`🗑️  Сессия удалена: ${sessionKey.substring(0, 10)}...`);
    }
    return deleted;
};

export const getSessionByConnection = async (connectionId) => {
    console.log(`🔍 Поиск сессии по connection: ${connectionId}`);
    return null; // Заглушка
};

export const updateAccountInfo = async (userId, updates) => {
    console.log(`🔧 updateAccountInfo для пользователя ${userId}:`, updates);
    return false; // Заглушка
};

export const validateToken = async (token) => {
    console.log(`[AccountManager] validateToken: ${token?.substring(0, 10)}...`);
    return { valid: false, userId: null, session: null };
};

export const simpleAuth = AccountManager.connectAccount; // Алиас

// Экспорт класса как default
export default AccountManager;
