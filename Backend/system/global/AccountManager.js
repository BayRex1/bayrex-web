// system/global/AccountManager.js

import crypto from 'crypto';

// Простейшая "память" для аккаунтов и сессий
const memoryStorage = {
    accounts: new Map(),       // key: account ID, value: account data
    sessions: new Map(),       // key: session key, value: { accountId, device, type }
};

class AccountManager {
    constructor(accountId) {
        this.accountId = accountId;
    }

    // Проверка пароля (предполагается хранение хеша)
    async verifyPassword(password) {
        const account = memoryStorage.accounts.get(this.accountId);
        if (!account) return false;
        return account.password === password; // В реальном проекте использовать bcrypt
    }

    // Создание сессии
    async startSession(deviceType = null, device = null) {
        const S_KEY = crypto.randomBytes(16).toString('hex');
        memoryStorage.sessions.set(S_KEY, {
            accountId: this.accountId,
            deviceType,
            device,
            createdAt: new Date(),
        });
        return S_KEY;
    }

    // Статические методы для работы с памятью

    static getSession(S_KEY) {
        return memoryStorage.sessions.get(S_KEY) || null;
    }

    static getUserSessions(accountId) {
        const sessions = [];
        for (const [key, session] of memoryStorage.sessions.entries()) {
            if (session.accountId === accountId) sessions.push({ key, ...session });
        }
        return sessions;
    }

    static deleteSession(S_KEY) {
        return memoryStorage.sessions.delete(S_KEY);
    }

    static debugMemory() {
        return memoryStorage;
    }

    static getAccounts() {
        return Array.from(memoryStorage.accounts.values());
    }

    static async updateAccount(id, updates) {
        if (!memoryStorage.accounts.has(id)) {
            throw new Error('Аккаунт не найден');
        }
        const account = memoryStorage.accounts.get(id);
        const updated = { ...account, ...updates };
        memoryStorage.accounts.set(id, updated);
        return updated;
    }

    static async createAccount({ username, email, password, name }) {
        const id = memoryStorage.accounts.size + 1000;
        const account = { ID: id, username, email, name, password };
        memoryStorage.accounts.set(id, account);
        return account;
    }
}

// Экспорт по дефолту и по именам
export default AccountManager;
export const debugMemory = AccountManager.debugMemory;
export const getSession = AccountManager.getSession;
export const getUserSessions = AccountManager.getUserSessions;
export const deleteSession = AccountManager.deleteSession;
export const updateAccount = AccountManager.updateAccount;
export const createAccount = AccountManager.createAccount;
export const getAccounts = AccountManager.getAccounts;
