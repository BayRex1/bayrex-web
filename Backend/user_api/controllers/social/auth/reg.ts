import axios from 'axios';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Config from '../../../../system/global/Config.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import Validator from '../../../../services/system/Validator.js';
import { getDate } from '../../../../system/global/Function.js';

// Хранилище аккаунтов в памяти
const memoryStorage = {
    accounts: new Map(),
    sessions: new Map(),
    permissions: new Map(),
    nextAccountId: 1000
};

// Проверка уникальности username и email
const checkUniqueCredentials = (username, email) => {
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

// Валидация капчи
const validateCaptcha = async (hCaptchaToken) => {
    if (!Config.CAPTCHA || !Config.CAPTCHA_KEY) {
        console.log('⚠️  Капча отключена в конфигурации');
        return true;
    }

    if (!hCaptchaToken) {
        throw new Error('Токен капчи не предоставлен');
    }

    try {
        const params = new URLSearchParams();
        params.append('secret', Config.CAPTCHA_KEY);
        params.append('response', hCaptchaToken);
        
        // Для hCaptcha
        const captchaUrl = Config.CAPTCHA_URL || 'https://hcaptcha.com/siteverify';
        
        const captchaRes = await axios.post(captchaUrl, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
        });

        console.log('🔐 Ответ капчи:', captchaRes.data);

        if (!captchaRes.data.success) {
            const errorCodes = captchaRes.data['error-codes'] || [];
            let errorMessage = 'Проверка капчи не пройдена';
            
            // Расшифровка кодов ошибок hCaptcha
            if (errorCodes.includes('missing-input-secret')) {
                errorMessage = 'Ошибка сервера капчи: отсутствует секретный ключ';
            } else if (errorCodes.includes('invalid-input-secret')) {
                errorMessage = 'Ошибка сервера капчи: неверный секретный ключ';
            } else if (errorCodes.includes('missing-input-response')) {
                errorMessage = 'Капча не была решена';
            } else if (errorCodes.includes('invalid-input-response')) {
                errorMessage = 'Неверный ответ капчи';
            } else if (errorCodes.includes('bad-request')) {
                errorMessage = 'Некорректный запрос к сервису капчи';
            } else if (errorCodes.includes('timeout-or-duplicate')) {
                errorMessage = 'Ответ капчи устарел или был использован ранее';
            }
            
            throw new Error(errorMessage);
        }

        return true;
    } catch (error) {
        console.error('❌ Ошибка проверки капчи:', error.message);
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            throw new Error('Сервис капчи временно недоступен. Попробуйте позже');
        }
        
        throw new Error('Ошибка при проверке капчи: ' + error.message);
    }
};

// Создание аккаунта в памяти
const createAccountInMemory = async (accountData) => {
    const { name, username, email, password } = accountData;
    
    // Проверяем уникальность
    checkUniqueCredentials(username, email);
    
    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаем новый ID
    const newId = memoryStorage.nextAccountId++;
    
    // Создаем объект аккаунта
    const newAccount = {
        ID: newId,
        Name: name,
        Username: username,
        Email: email,
        Password: hashedPassword,
        CreateDate: getDate(),
        Avatar: null,
        Cover: null,
        Description: '',
        Eballs: 100, // Начальный баланс
        last_post: null,
        last_comment: null,
        last_song: null
    };

    // Сохраняем в память
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

    console.log(`✅ Аккаунт создан в памяти: ${username} (ID: ${newId}, Email: ${email})`);
    
    return newAccount;
};

// Создание сессии
const createSession = (accountId, deviceType = 'browser', device = null) => {
    const S_KEY = crypto.randomBytes(32).toString('hex');
    
    const session = {
        uid: accountId,
        s_key: S_KEY,
        device_type: deviceType === 'browser' ? 1 : 
                    deviceType === 'android_app' ? 2 :
                    deviceType === 'ios_app' ? 3 :
                    deviceType === 'windows_app' ? 4 : 0,
        device: device || 'unknown',
        create_date: getDate()
    };

    // Сохраняем сессию
    memoryStorage.sessions.set(S_KEY, session);
    
    console.log(`✅ Сессия создана для аккаунта ${accountId}`);
    
    return S_KEY;
};

// Получение данных аккаунта
const getAccountData = (accountId) => {
    const account = memoryStorage.accounts.get(accountId);
    if (!account) {
        throw new Error('Аккаунт не найден');
    }
    
    // Возвращаем безопасные данные (без пароля)
    const { Password, ...safeAccountData } = account;
    return safeAccountData;
};

export const reg = async ({ data }) => {
    console.log('📝 Начало регистрации:', {
        username: data.username,
        email: data.email,
        name: data.name
    });

    // Проверка включена ли регистрация
    if (Config.REGISTRATION === false) {
        console.log('❌ Регистрация отключена в конфигурации');
        return RouterHelper.error('Регистрация временно отключена. Попробуйте позже.');
    }

    // Подготовка username
    let username = data.username?.replace('@', '')?.trim() || null;
    const email = data.email?.trim() || null;
    const name = data.name?.trim() || null;
    const password = data.password || null;

    // Базовая валидация
    if (!username || username.length < 3) {
        return RouterHelper.error('Логин должен быть не короче 3 символов');
    }
    
    if (username.length > 40) {
        return RouterHelper.error('Логин слишком длинный (макс. 40 символов)');
    }
    
    // Проверка допустимых символов в username
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
        return RouterHelper.error('Логин может содержать только буквы, цифры, точки, дефисы и подчеркивания');
    }
    
    if (!email || !email.includes('@') || !email.includes('.')) {
        return RouterHelper.error('Пожалуйста, введите корректный email адрес');
    }
    
    if (!name || name.length < 2) {
        return RouterHelper.error('Имя должно быть не короче 2 символов');
    }
    
    if (name.length > 60) {
        return RouterHelper.error('Имя слишком длинное (макс. 60 символов)');
    }
    
    if (!password || password.length < 6) {
        return RouterHelper.error('Пароль должен быть не короче 6 символов');
    }
    
    if (password.length > 100) {
        return RouterHelper.error('Пароль слишком длинный (макс. 100 символов)');
    }

    // Проверка согласия с правилами
    if (!data.accept || data.accept !== true) {
        return RouterHelper.error('Вы должны принять пользовательское соглашение');
    }

    try {
        // Проверка капчи (если включена)
        if (Config.CAPTCHA !== false) {
            console.log('🔐 Проверяю капчу...');
            await validateCaptcha(data.h_captcha);
            console.log('✅ Капча пройдена');
        } else {
            console.log('⚠️  Капча отключена, пропускаем проверку');
        }

        // Создаем аккаунт в памяти
        console.log('👤 Создаю аккаунт в памяти...');
        const account = await createAccountInMemory({
            name: name,
            username: username,
            email: email,
            password: password
        });

        // Создаем сессию
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
            sessionKey: S_KEY.substring(0, 10) + '...'
        });

        // Статистика
        console.log(`📊 Всего аккаунтов в памяти: ${memoryStorage.accounts.size}`);
        console.log(`📊 Всего активных сессий: ${memoryStorage.sessions.size}`);

        return RouterHelper.success({
            S_KEY: S_KEY,
            accountID: account.ID,
            accountData: accountData,
            message: 'Регистрация успешно завершена! Добро пожаловать!',
            serverTime: getDate(),
            mode: 'memory-storage'
        });

    } catch (error) {
        console.error('❌ Ошибка при регистрации:', error.message);
        
        // Пользовательские ошибки
        if (error.message.includes('логин уже занят') || 
            error.message.includes('email уже используется') ||
            error.message.includes('Капча') ||
            error.message.includes('пароль') ||
            error.message.includes('email') ||
            error.message.includes('логин')) {
            return RouterHelper.error(error.message);
        }
        
        // Системные ошибки
        return RouterHelper.error(
            'Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз или обратитесь в поддержку.'
        );
    }
};

// Дополнительные экспорты для отладки
export const debugMemory = () => {
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

// Очистка памяти (для тестов)
export const clearMemoryStorage = () => {
    memoryStorage.accounts.clear();
    memoryStorage.sessions.clear();
    memoryStorage.permissions.clear();
    memoryStorage.nextAccountId = 1000;
    console.log('🧹 Память очищена');
};

export default reg;
