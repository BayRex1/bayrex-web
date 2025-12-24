import axios from 'axios';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Config from '../../../../system/global/Config.js';

// ⭐ ИМПОРТИРУЕМ ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ ⭐
import { getMemoryStorage } from '../../../../services/account/AccountStorage.js';

// Удаляем локальное хранилище:
// const memoryStorage = { ... }; // ⚠️ УДАЛИТЬ!

// Вместо этого используем глобальное:
const getStorage = () => getMemoryStorage();

// Локальные реализации на случай отсутствия импортов
const LocalRouterHelper = {
    success: (data: any) => ({
        status: 'success',
        ...data
    }),
    error: (message: string) => ({
        status: 'error',
        message: message
    })
};

const LocalValidator = {
    validateEmail: async (email: string) => {
        if (!email || !email.includes('@') || !email.includes('.')) {
            throw new Error('Неверный формат email');
        }
        return true;
    },
    validateText: ({ title, value, maxLength }: { title: string; value: string; maxLength: number }) => {
        if (!value || value.trim().length === 0) {
            throw new Error(`${title} не может быть пустым`);
        }
        if (value.length > maxLength) {
            throw new Error(`${title} слишком длинный (макс. ${maxLength} символов)`);
        }
        return true;
    }
};

const getDate = () => new Date().toISOString();

// Проверка уникальности username и email
const checkUniqueCredentials = (username: string, email: string) => {
    const memoryStorage = getStorage();
    
    for (const [id, account] of memoryStorage.accounts.entries()) {
        if (account.Username === username) {
            throw new Error('Этот логин уже занят');
        }
        if (account.Email === email) {
            throw new Error('Этот email уже используется');
        }
    }
    return true;
};

// Валидация капчи (упрощенная для разработки)
const validateCaptcha = async (hCaptchaToken: string) => {
    // В режиме разработки отключаем капчу
    console.log('⚠️  Капча отключена для разработки');
    return true;
};

// Создание аккаунта в памяти
const createAccountInMemory = async (accountData: {
    name: string;
    username: string;
    email: string;
    password: string;
}) => {
    const { name, username, email, password } = accountData;
    const memoryStorage = getStorage();
    
    // Проверяем уникальность
    checkUniqueCredentials(username, email);
    
    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаем новый ID (используем глобальный счетчик)
    const newId = memoryStorage.nextAccountId++;
    
    // Создаем объект аккаунта
    const newAccount = {
        ID: newId,
        Name: name,
        Username: username,
        Email: email,
        Password: hashedPassword,
        CreateDate: getDate(),
        Avatar: null as string | null,
        Cover: null as string | null,
        Description: '',
        Eballs: 100,
        last_post: null as string | null,
        last_comment: null as string | null,
        last_song: null as string | null,
        messenger_size: 0,
        Keyword: 0,
        Posts: 0,
        Subscribers: 0,
        Subscriptions: 0,
        Links: 0
    };

    // Сохраняем в ГЛОБАЛЬНОЕ хранилище
    memoryStorage.accounts.set(newId, newAccount);
    
    // Создаем дефолтные права
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

    console.log(`✅ Аккаунт создан в ГЛОБАЛЬНОМ хранилище: ${username} (ID: ${newId}, Email: ${email})`);
    
    return newAccount;
};

// Создание сессии
const createSession = (accountId: number, deviceType: string = 'browser', device: string | null = null) => {
    const memoryStorage = getStorage();
    const S_KEY = crypto.randomBytes(32).toString('hex');
    
    const session = {
        uid: accountId,
        s_key: S_KEY,
        device_type: deviceType === 'browser' ? 1 : 
                    deviceType === 'android_app' ? 2 :
                    deviceType === 'ios_app' ? 3 :
                    deviceType === 'windows_app' ? 4 : 0,
        device: device || 'unknown',
        create_date: getDate(),
        aesKey: 'mock_aes_key_for_testing',
        mesKey: 'mock_mes_key_for_testing',
        connection: null,
        lastActive: getDate()
    };

    // Сохраняем сессию в ГЛОБАЛЬНОЕ хранилище
    memoryStorage.sessions.set(S_KEY, session);
    
    console.log(`✅ Сессия создана в ГЛОБАЛЬНОМ хранилище для аккаунта ${accountId}: ${S_KEY.substring(0, 10)}...`);
    
    return S_KEY;
};

// Получение данных аккаунта
const getAccountData = (accountId: number) => {
    const memoryStorage = getStorage();
    const account = memoryStorage.accounts.get(accountId);
    if (!account) {
        throw new Error('Аккаунт не найден');
    }
    
    // Возвращаем безопасные данные (без пароля)
    const { Password, ...safeAccountData } = account;
    return safeAccountData;
};

export const reg = async ({ data }: { data: any }) => {
    console.log('📝 Начало регистрации (исправленная версия):', {
        username: data.username,
        email: data.email?.substring(0, 10) + '...',
        name: data.name
    });

    // Проверка включена ли регистрация
    if (Config.REGISTRATION === false) {
        console.log('❌ Регистрация отключена в конфигурации');
        return LocalRouterHelper.error('Регистрация временно отключена. Попробуйте позже.');
    }

    // Подготовка username
    let username = data.username?.replace('@', '')?.trim() || null;
    const email = data.email?.trim() || null;
    const name = data.name?.trim() || null;
    const password = data.password || null;

    // Базовая валидация
    if (!username || username.length < 3) {
        return LocalRouterHelper.error('Логин должен быть не короче 3 символов');
    }
    
    if (username.length > 40) {
        return LocalRouterHelper.error('Логин слишком длинный (макс. 40 символов)');
    }
    
    // Проверка допустимых символов в username
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
        return LocalRouterHelper.error('Логин может содержать только буквы, цифры, точки, дефисы и подчеркивания');
    }
    
    if (!email || !email.includes('@') || !email.includes('.')) {
        return LocalRouterHelper.error('Пожалуйста, введите корректный email адрес');
    }
    
    if (!name || name.length < 2) {
        return LocalRouterHelper.error('Имя должно быть не короче 2 символов');
    }
    
    if (name.length > 60) {
        return LocalRouterHelper.error('Имя слишком длинное (макс. 60 символов)');
    }
    
    if (!password || password.length < 6) {
        return LocalRouterHelper.error('Пароль должен быть не короче 6 символов');
    }
    
    if (password.length > 100) {
        return LocalRouterHelper.error('Пароль слишком длинный (макс. 100 символов)');
    }

    // Проверка согласия с правилами
    if (!data.accept || data.accept !== true) {
        return LocalRouterHelper.error('Вы должны принять пользовательское соглашение');
    }

    try {
        // Проверка капчи (если включена) - временно отключена
        if (Config.CAPTCHA !== false) {
            console.log('🔐 Проверяю капчу...');
            await validateCaptcha(data.h_captcha);
            console.log('✅ Капча пройдена');
        } else {
            console.log('⚠️  Капча отключена, пропускаем проверку');
        }

        // Создаем аккаунт в ГЛОБАЛЬНОМ хранилище
        console.log('👤 Создаю аккаунт в ГЛОБАЛЬНОМ хранилище...');
        const account = await createAccountInMemory({
            name: name!,
            username: username!,
            email: email!,
            password: password!
        });

        // Создаем сессию в ГЛОБАЛЬНОМ хранилище
        console.log('🔑 Создаю сессию...');
        const S_KEY = createSession(
            account.ID,
            data.device_type || 'browser',
            data.device || null
        );

        // Получаем данные аккаунта для ответа
        const accountData = getAccountData(account.ID);
        
        console.log('🎉 Регистрация успешно завершена!', {
            accountId: account.ID,
            username: account.Username,
            email: account.Email,
            sessionKey: S_KEY.substring(0, 10) + '...'
        });

        // Статистика
        const memoryStorage = getStorage();
        console.log(`📊 Всего аккаунтов в ГЛОБАЛЬНОМ хранилище: ${memoryStorage.accounts.size}`);
        console.log(`📊 Всего активных сессий: ${memoryStorage.sessions.size}`);

        // ⭐ ВАЖНО: Добавляем permissions в ответ
        const permissions = memoryStorage.permissions.get(account.ID) || {
            Posts: true,
            Comments: true,
            NewChats: true,
            MusicUpload: false,
            Admin: false,
            Verified: false,
            Fake: false
        };

        return LocalRouterHelper.success({
            S_KEY: S_KEY,
            accountID: account.ID,
            accountData: {
                ...accountData,
                permissions: permissions
            },
            message: 'Регистрация успешно завершена! Добро пожаловать!',
            serverTime: getDate(),
            mode: 'global-memory-storage'
        });

    } catch (error: any) {
        console.error('❌ Ошибка при регистрации:', error.message);
        
        // Пользовательские ошибки
        if (error.message.includes('логин уже занят') || 
            error.message.includes('email уже используется') ||
            error.message.includes('Капча') ||
            error.message.includes('пароль') ||
            error.message.includes('email') ||
            error.message.includes('логин')) {
            return LocalRouterHelper.error(error.message);
        }
        
        // Системные ошибки
        return LocalRouterHelper.error(
            'Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.'
        );
    }
};

// Экспорт для отладки
export const debugMemory = () => {
    const memoryStorage = getStorage();
    return {
        totalAccounts: memoryStorage.accounts.size,
        totalSessions: memoryStorage.sessions.size,
        nextAccountId: memoryStorage.nextAccountId,
        accounts: Array.from(memoryStorage.accounts.keys()),
        sampleAccount: memoryStorage.accounts.size > 0 ? 
            getAccountData(Array.from(memoryStorage.accounts.keys())[0]) : 
            null
    };
};

export default reg;
