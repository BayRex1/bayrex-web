import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Config from './Config.js';
import AppError from '../../services/system/AppError.js';

// ================================
// In-memory хранилище (заглушка)
// ================================
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

    // ================================
    // Создание аккаунта
    // ================================
    static async createAccount(accountData) {
        const { name, username, email, password } = accountData;

        for (const acc of memoryStorage.accounts.values()) {
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

        console.log(`✅ Аккаунт создан: ${username} (ID ${newId})`);
        return { id: newId, account: newAccount };
    }

    static getInstance(id) {
        return new AccountManager(id);
    }

    // ================================
    // Сессии
    // ================================
    async startSession(deviceType, device) {
        const S_KEY = crypto.randomBytes(32).toString('hex');

        const session = {
            uid: this.accountID,
            s_key: S_KEY,
            device_type: deviceType === 'browser' ? 1 : 0,
            device: device || 'unknown',
            create_date: new Date().toISOString(),
            aesKey: 'mock_aes_key',
            mesKey: 'mock_mes_key'
        };

        memoryStorage.sessions.set(S_KEY, session);

        console.log(`✅ Сессия создана: ${S_KEY.substring(0, 8)}...`);
        return S_KEY;
    }

    static async getSession(sessionKey) {
        if (typeof sessionKey === 'number') {
            for (const [sKey, session] of memoryStorage.sessions.entries()) {
                if (session.uid === sessionKey) {
                    return {
                        ID: session.uid,
                        uid: session.uid,
                        s_key: sKey,
                        aesKey: session.aesKey,
                        mesKey: session.mesKey,
                        connection: null,
                        device_type: session.device_type,
                        device: session.device,
                        create_date: session.create_date
                    };
                }
            }
        }

        if (typeof sessionKey === 'string') {
            const session = memoryStorage.sessions.get(sessionKey);
            if (session) {
                return {
                    ID: session.uid,
                    uid: session.uid,
                    s_key: sessionKey,
                    aesKey: session.aesKey,
                    mesKey: session.mesKey,
                    connection: null,
                    device_type: session.device_type,
                    device: session.device,
                    create_date: session.create_date
                };
            }
        }

        return null;
    }

    static async deleteSession(sessionKey) {
        return memoryStorage.sessions.delete(sessionKey);
    }

    static async getUserSessions(userId) {
        const result = [];
        for (const [key, session] of memoryStorage.sessions.entries()) {
            if (session.uid === userId) {
                result.push({
                    s_key: key,
                    device_type: session.device_type,
                    device: session.device,
                    create_date: session.create_date
                });
            }
        }
        return result;
    }

    // ================================
    // Аккаунт
    // ================================
    async verifyPassword(password) {
        return bcrypt.compare(password, this.accountData.Password);
    }

    async getAccountData() {
        const { Password, ...safe } = this.accountData;
        return safe;
    }

    async getFullAccountData() {
        return this.accountData;
    }

    async getPermissions() {
        return memoryStorage.permissions.get(this.accountID);
    }

    async updateAccountData(updates) {
        const updated = { ...this.accountData, ...updates };
        memoryStorage.accounts.set(this.accountID, updated);
        this.accountData = updated;
        return true;
    }

    // ================================
    // 🔧 КЛЮЧЕВАЯ ЗАГЛУШКА
    // ================================
    static async updateAccount(accountId, updates = {}) {
        const account = memoryStorage.accounts.get(accountId);
        if (!account) {
            console.log(`❌ updateAccount: аккаунт ${accountId} не найден`);
            return false;
        }

        memoryStorage.accounts.set(accountId, {
            ...account,
            ...updates
        });

        console.log(`✅ updateAccount обновил аккаунт ${accountId}`);
        return true;
    }

    // ================================
    // Заглушки
    // ================================
    async getGoldStatus() { return { activated: false, date_get: null }; }
    async getGoldHistory() { return []; }
    async getChannels() { return []; }
    async getMessengerNotifications() { return 0; }

    async changeAvatar() { return { status: 'success' }; }
    async changeCover() { return { status: 'success' }; }
    async changeName() { return { status: 'success' }; }
    async changeUsername() { return { status: 'success' }; }
    async changeDescription() { return { status: 'success' }; }
    async changeEmail() { return { status: 'success' }; }
    async changePassword() { return { status: 'success' }; }
    async addEballs() { return true; }
    async maybeReward() { return true; }

    static async sendMessageToUser(params, message) {
        const userId = typeof params === 'object' ? params.uid : params;
        console.log(`📨 sendMessageToUser → user ${userId}`);
        return { success: true };
    }
}

// ================================
// Экспорты для совместимости
// ================================
export const getSession = AccountManager.getSession;
export const sendMessageToUser = AccountManager.sendMessageToUser;
export const getUserSessions = AccountManager.getUserSessions;
export const deleteSession = AccountManager.deleteSession;
export const createAccount = AccountManager.createAccount;
export const getInstance = AccountManager.getInstance;
export const updateAccount = AccountManager.updateAccount;

export default AccountManager;
