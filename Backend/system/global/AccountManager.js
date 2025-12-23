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

    // Создание аккаунта
    static async createAccount({ name, username, email, password }) {
        for (const [, acc] of memoryStorage.accounts.entries()) {
            if (acc.Username.toLowerCase() === username.toLowerCase()) {
                throw new AppError('Этот логин уже занят');
            }
            if (acc.Email.toLowerCase() === email.toLowerCase()) {
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
            CreateDate: new Date().toISOString()
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

        return { id: newId, account: newAccount };
    }

    // Проверка пароля
    async verifyPassword(password) {
        return await bcrypt.compare(password, this.accountData.Password);
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
        return S_KEY;
    }

    // Получение всех аккаунтов и сессий для отладки
    static debugMemory() {
        return {
            totalAccounts: memoryStorage.accounts.size,
            totalSessions: memoryStorage.sessions.size,
            nextAccountId: memoryStorage.nextAccountId,
            accounts: Array.from(memoryStorage.accounts.values()),
            sessions: Array.from(memoryStorage.sessions.values())
        };
    }

    // Доступ к памяти из других модулей
    static memory = memoryStorage;
}

export default AccountManager;
export const debugMemory = AccountManager.debugMemory;
export const memory = AccountManager.memory;
