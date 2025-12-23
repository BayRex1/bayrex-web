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
            Notifications: 0
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

    // Получение экземпляра AccountManager
    static getInstance(id) {
        return new AccountManager(id);
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
            mesKey: 'mock_mes_key_for_testing'
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

    // Остальные методы (заглушки для совместимости)
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
                        connection: null,
                        device_type: session.device_type,
                        device: session.device,
                        create_date: session.create_date
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
                    connection: null,
                    device_type: session.device_type,
                    device: session.device,
                    create_date: session.create_date
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
            create_date: new Date().toISOString()
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
        const sessions = [];
        for (const [sKey, session] of memoryStorage.sessions.entries()) {
            if (session.uid === userId) {
                sessions.push({
                    s_key: sKey,
                    device_type: session.device_type,
                    device: session.device,
                    create_date: session.create_date
                });
            }
        }
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
}

// Экспорт функций для совместимости с другими модулями
export const getSession = AccountManager.getSession;
export const sendMessageToUser = AccountManager.sendMessageToUser;
export const getUserSessions = AccountManager.getUserSessions;
export const deleteSession = AccountManager.deleteSession;
export const createAccount = AccountManager.createAccount;
export const getInstance = AccountManager.getInstance;

// Экспорт для отладки
export const debugMemory = () => ({
    totalAccounts: memoryStorage.accounts.size,
    totalSessions: memoryStorage.sessions.size,
    nextAccountId: memoryStorage.nextAccountId,
    accounts: Array.from(memoryStorage.accounts.entries()).map(([id, acc]) => ({
        ID: id,
        Username: acc.Username,
        Email: acc.Email,
        Name: acc.Name
    })),
    sessions: Array.from(memoryStorage.sessions.entries()).map(([key, session]) => ({
        key: key.substring(0, 10) + '...',
        uid: session.uid,
        device: session.device
    }))
});

// Экспорт класса как default
export default AccountManager;
