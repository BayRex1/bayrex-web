// AccountManager.ts - версия без БД
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Config from '../../system/global/Config.js';
import AppError from '../system/AppError.js';
import ImageEngine from '../system/ImageEngine.js';
import Validator from '../system/Validator.js';
import { getDate } from '../../system/global/Function.js';

// Хранилище в памяти
const memoryStorage = {
    accounts: new Map<number, any>(),
    sessions: new Map<string, any>(),
    permissions: new Map<number, any>(),
    nextAccountId: 1000,
    nextSessionId: 1
};

class AccountManager {
    private accountID: number;
    private accountData: any = null;

    constructor(id: number) {
        if (!id || typeof id !== 'number' || id <= 0) {
            throw new AppError('Некорректный идентификатор аккаунта');
        }
        
        // Проверяем, существует ли аккаунт
        if (!memoryStorage.accounts.has(id)) {
            throw new AppError('Аккаунт не найден в памяти');
        }
        
        this.accountID = id;
        this.accountData = memoryStorage.accounts.get(id);
    }

    // Статический метод для создания аккаунта (вызывается из reg.ts)
    static async createAccount(accountData: {
        name: string;
        username: string;
        email: string;
        password: string;
    }): Promise<{ id: number; account: any }> {
        
        // Проверяем уникальность username и email
        for (const [id, acc] of memoryStorage.accounts.entries()) {
            if (acc.Username === accountData.username) {
                throw new AppError('Этот логин уже занят');
            }
            if (acc.Email === accountData.email) {
                throw new AppError('Этот email уже используется');
            }
        }

        const newId = memoryStorage.nextAccountId++;
        const hashedPassword = await bcrypt.hash(accountData.password, 10);
        
        const newAccount = {
            ID: newId,
            Name: accountData.name,
            Username: accountData.username,
            Email: accountData.email,
            Password: hashedPassword,
            CreateDate: getDate(),
            Avatar: null,
            Cover: null,
            Description: '',
            Eballs: 0
        };

        memoryStorage.accounts.set(newId, newAccount);
        
        // Создаем дефолтные permissions
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

        console.log(`✅ Аккаунт создан в памяти: ${accountData.username} (ID: ${newId})`);
        
        return { id: newId, account: newAccount };
    }

    // Метод для получения AccountManager по ID (после создания)
    static getInstance(id: number): AccountManager {
        return new AccountManager(id);
    }

    // Создание сессии (упрощенная версия)
    async startSession(deviceType: string, device: string | null): Promise<string> {
        const S_KEY = crypto.randomBytes(32).toString('hex');
        
        const session = {
            uid: this.accountID,
            s_key: S_KEY,
            device_type: deviceType === 'browser' ? 1 : 0,
            device: device || 'unknown',
            create_date: getDate()
        };

        // Сохраняем в памяти (в реальности - в Redis)
        memoryStorage.sessions.set(S_KEY, session);
        
        console.log(`✅ Сессия создана для аккаунта ${this.accountID}: ${S_KEY}`);
        return S_KEY;
    }

    // Проверка пароля
    async verifyPassword(password: string): Promise<boolean> {
        if (!this.accountData) {
            throw new AppError('Данные аккаунта не загружены');
        }

        return await bcrypt.compare(password, this.accountData.Password);
    }

    // Получение данных аккаунта
    async getAccountData(): Promise<any> {
        return this.accountData;
    }

    // Получение permissions
    async getPermissions(): Promise<any> {
        const perms = memoryStorage.permissions.get(this.accountID) || {
            Posts: true,
            Comments: true,
            NewChats: true,
            MusicUpload: false,
            Admin: false,
            Verified: false,
            Fake: false
        };
        return perms;
    }

    // Остальные методы можно оставить как заглушки или упростить
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
