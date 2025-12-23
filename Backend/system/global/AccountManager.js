import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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

        if (!memoryStorage.accounts.has(id)) {
            throw new AppError('Аккаунт не найден');
        }
        this.accountData = memoryStorage.accounts.get(id);
    }

    // Создание нового аккаунта
    static async createAccount({ name, username, email, password }) {
        // Проверка уникальности
        for (const acc of memoryStorage.accounts.values()) {
            if (acc.Username === username) throw new AppError('Логин занят');
            if (acc.Email === email) throw new AppError('Email уже используется');
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

        console.log(`✅ Аккаунт создан: ${username} (ID: ${newId})`);
        return { id: newId, account: newAccount };
    }

    // Получение экземпляра
    static getInstance(id) {
        return new AccountManager(id);
    }

    // Создание сессии
    async startSession(deviceType = null, device = 'unknown') {
        const S_KEY = crypto.randomBytes(32).toString('hex');
        const session = {
            uid: this.accountID,
            s_key: S_KEY,
            device_type: deviceType === 'browser' ? 1 : 0,
            device,
            create_date: new Date().toISOString(),
            aesKey: 'mock_aes_key',
            mesKey: 'mock_mes_key'
        };
        memoryStorage.sessions.set(S_KEY, session);
        console.log(`✅ Сессия создана: ${S_KEY.substring(0, 10)}...`);
        return S_KEY;
    }

    // Проверка пароля
    async verifyPassword(password) {
        return await bcrypt.compare(password, this.accountData.Password);
    }

    // Получение безопасных данных
    async getAccountData() {
        const { Password, ...safeData } = this.accountData;
        return safeData;
    }

    // Получение permissions
    async getPermissions() {
        return memoryStorage.permissions.get(this.accountID) || {};
    }

    // Обновление данных
    async updateAccountData(updates) {
        this.accountData = { ...this.accountData, ...updates };
        memoryStorage.accounts.set(this.accountID, this.accountData);
        return true;
    }

    // -----------------
    // Методы для работы с сессиями
    // -----------------
    static getSession(sessionKey) {
        if (typeof sessionKey === 'number') {
            for (const session of memoryStorage.sessions.values()) {
                if (session.uid === sessionKey) return session;
            }
        } else if (typeof sessionKey === 'string') {
            return memoryStorage.sessions.get(sessionKey);
        }
        return null;
    }

    static getUserSessions(userId) {
        const sessions = [];
        for (const session of memoryStorage.sessions.values()) {
            if (session.uid === userId) sessions.push(session);
        }
        return sessions;
    }

    static deleteSession(sessionKey) {
        return memoryStorage.sessions.delete(sessionKey);
    }

    // -----------------
    // Отладка
    // -----------------
    static debugMemory() {
        return {
            totalAccounts: memoryStorage.accounts.size,
            totalSessions: memoryStorage.sessions.size,
            nextAccountId: memoryStorage.nextAccountId,
            accounts: Array.from(memoryStorage.accounts.values()).map(acc => ({
                ID: acc.ID,
                Username: acc.Username,
                Email: acc.Email,
                Name: acc.Name
            })),
            sessions: Array.from(memoryStorage.sessions.values()).map(s => ({
                s_key: s.s_key.substring(0, 10) + '...',
                uid: s.uid,
                device: s.device
            }))
        };
    }
}

// Экспорт
export default AccountManager;
export const debugMemory = AccountManager.debugMemory;
export const getSession = AccountManager.getSession;
export const getUserSessions = AccountManager.getUserSessions;
export const deleteSession = AccountManager.deleteSession;
