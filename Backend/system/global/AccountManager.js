// Backend/system/global/AccountManager.js

import crypto from 'crypto';

// Временное хранилище аккаунтов и сессий в памяти
const accounts = new Map();   // key: account ID, value: account object
const sessions = new Map();   // key: session key, value: account ID
let nextAccountId = 1000;

export default class AccountManager {
    constructor(accountId) {
        this.accountId = accountId;
        this.account = accounts.get(accountId);
    }

    // Проверка пароля
    async verifyPassword(password) {
        if (!this.account) return false;
        // Можно заменить на bcrypt для продакшена
        return this.account.password === password;
    }

    // Создание сессии
    async startSession(deviceType = null, device = null) {
        const sessionKey = crypto.randomBytes(16).toString('hex');
        const session = {
            key: sessionKey,
            accountId: this.accountId,
            deviceType,
            device,
            createdAt: new Date(),
        };
        sessions.set(sessionKey, this.accountId);
        return sessionKey;
    }

    // Обновление данных аккаунта
    async updateAccount(data) {
        if (!this.account) return false;
        Object.assign(this.account, data);
        accounts.set(this.accountId, this.account);
        return true;
    }

    // Получение аккаунта по ID
    static getAccount(accountId) {
        return accounts.get(accountId) || null;
    }

    // Получение аккаунта по email
    static getAccountByEmail(email) {
        for (const account of accounts.values()) {
            if (account.email === email) return account;
        }
        return null;
    }

    // Получение сессии по ключу
    static getSession(sessionKey) {
        const accountId = sessions.get(sessionKey);
        if (!accountId) return null;
        return accounts.get(accountId) || null;
    }

    // Создание нового аккаунта
    static createAccount({ username, email, password, name }) {
        const existing = this.getAccountByEmail(email);
        if (existing) return null;

        const accountId = nextAccountId++;
        const account = {
            ID: accountId,
            username,
            email,
            password,  // для продакшена использовать хеш
            name,
            createdAt: new Date(),
        };
        accounts.set(accountId, account);
        return account;
    }

    // Для отладки памяти
    static debugMemory() {
        return {
            accounts: Array.from(accounts.values()),
            sessions: Array.from(sessions.entries()),
        };
    }
}

// Дополнительно экспортируем функции для удобства
export { accounts, sessions, AccountManager };
export function getSession(sessionKey) {
    return AccountManager.getSession(sessionKey);
}
export function updateAccount(accountId, data) {
    const manager = new AccountManager(accountId);
    return manager.updateAccount(data);
}
