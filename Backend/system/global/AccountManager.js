import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Config from './Config.js';
import AppError from '../../services/system/AppError.js';

// ================================
// In-memory storage (mock)
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

        if (!memoryStorage.accounts.has(id)) {
            throw new AppError('Аккаунт не найден');
        }

        this.accountID = id;
        this.accountData = memoryStorage.accounts.get(id);
    }

    // ================================
    // Account creation
    // ================================
    static async createAccount({ name, username, email, password }) {
        for (const acc of memoryStorage.accounts.values()) {
            if (acc.Username === username) throw new AppError('Логин занят');
            if (acc.Email === email) throw new AppError('Email занят');
        }

        const id = memoryStorage.nextAccountId++;
        const hashedPassword = await bcrypt.hash(password, 10);

        const account = {
            ID: id,
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

        memoryStorage.accounts.set(id, account);
        memoryStorage.permissions.set(id, {
            UserID: id,
            Posts: true,
            Comments: true,
            NewChats: true,
            MusicUpload: false,
            Admin: false,
            Verified: false,
            Fake: false
        });

        console.log(`✅ Account created: ${username} (${id})`);
        return { id, account };
    }

    static getInstance(id) {
        return new AccountManager(id);
    }

    // ================================
    // Sessions
    // ================================
    async startSession(deviceType, device) {
        const sKey = crypto.randomBytes(32).toString('hex');

        memoryStorage.sessions.set(sKey, {
            uid: this.accountID,
            s_key: sKey,
            device_type: deviceType === 'browser' ? 1 : 0,
            device: device || 'unknown',
            create_date: new Date().toISOString(),
            aesKey: 'mock_aes_key',
            mesKey: 'mock_mes_key'
        });

        return sKey;
    }

    static async getSession(key) {
        if (typeof key === 'string') {
            return memoryStorage.sessions.get(key) || null;
        }

        if (typeof key === 'number') {
            for (const session of memoryStorage.sessions.values()) {
                if (session.uid === key) return session;
            }
        }

        return null;
    }

    static async updateSession(sessionKey, patch = {}) {
        const session = memoryStorage.sessions.get(sessionKey);
        if (!session) return false;

        memoryStorage.sessions.set(sessionKey, {
            ...session,
            ...patch
        });

        console.log(`✅ updateSession: ${sessionKey.substring(0, 8)}...`);
        return true;
    }

    static async deleteSession(sessionKey) {
        return memoryStorage.sessions.delete(sessionKey);
    }

    static async getUserSessions(userId) {
        return [...memoryStorage.sessions.values()].filter(s => s.uid === userId);
    }

    // ================================
    // Account methods
    // ================================
    async verifyPassword(password) {
        return bcrypt.compare(password, this.accountData.Password);
    }

    async getAccountData() {
        const { Password, ...safe } = this.accountData;
        return safe;
    }

    async updateAccountData(patch) {
        this.accountData = { ...this.accountData, ...patch };
        memoryStorage.accounts.set(this.accountID, this.accountData);
        return true;
    }

    static async updateAccount(accountId, patch = {}) {
        const acc = memoryStorage.accounts.get(accountId);
        if (!acc) return false;

        memoryStorage.accounts.set(accountId, { ...acc, ...patch });
        console.log(`✅ updateAccount: ${accountId}`);
        return true;
    }

    async getPermissions() {
        return memoryStorage.permissions.get(this.accountID);
    }

    // ================================
    // Stubs
    // ================================
    async getGoldStatus() { return { activated: false }; }
    async getGoldHistory() { return []; }
    async getChannels() { return []; }
    async getMessengerNotifications() { return 0; }

    static async sendMessageToUser(params, message) {
        const uid = typeof params === 'object' ? params.uid : params;
        console.log(`📨 sendMessageToUser → ${uid}`);
        return { success: true };
    }
}

// ================================
// Named exports (CRITICAL)
// ================================
export const getSession = AccountManager.getSession;
export const updateSession = AccountManager.updateSession;
export const deleteSession = AccountManager.deleteSession;
export const getUserSessions = AccountManager.getUserSessions;
export const createAccount = AccountManager.createAccount;
export const getInstance = AccountManager.getInstance;
export const updateAccount = AccountManager.updateAccount;
export const sendMessageToUser = AccountManager.sendMessageToUser;

export default AccountManager;
