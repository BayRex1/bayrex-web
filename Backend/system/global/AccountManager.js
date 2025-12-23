// AccountManager.js - с правильным путем импорта
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
            Eballs: 100
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
            create_date: new Date().toISOString()
        };

        memoryStorage.sessions.set(S_KEY, session);
        
        console.log(`✅ Сессия создана для аккаунта ${this.accountID}`);
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

    // Остальные методы
    async getGoldStatus() { return false; }
    async getGoldHistory() { return []; }
    async getChannels() { return []; }
    async getMessengerNotifications() { return 0; }
    async changeAvatar() { return { status: 'success', avatar: null }; }
    async changeCover() { return { status: 'success', cover: null }; }
    async changeName() { return { status: 'success' }; }
    async changeUsername() { return { status: 'success' }; }
    async changeDescription() { return { status: 'success' }; }
    async changeEmail() { return { status: 'success' }; }
    async changePassword() { return { status: 'success' }; }
    async addEballs() { return; }
    async maybeReward() { return; }
}

export default AccountManager;

// Экспорт для отладки
export const debugMemory = () => ({
    totalAccounts: memoryStorage.accounts.size,
    totalSessions: memoryStorage.sessions.size,
    accounts: Array.from(memoryStorage.accounts.values()).map(acc => ({
        ID: acc.ID,
        Username: acc.Username,
        Email: acc.Email
    }))
});
