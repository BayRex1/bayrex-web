// Backend/user_api/controllers/social/login.ts
import AccountManager, { debugMemory } from '../../../../system/global/AccountManager.js';
import Validator from '../../../../services/system/Validator.js';

const login = async ({ data }) => {
    try {
        const validator = new Validator();

        // Проверка email и пароля
        await validator.validateEmail(data.email);
        validator.validateText({ title: 'Пароль', value: data.password, maxLength: 100 });

        // Ищем аккаунт в памяти
        const memoryAccounts = debugMemory().accounts;
        const accountEntry = memoryAccounts.find(acc => acc.Email.toLowerCase() === data.email.toLowerCase());

        if (!accountEntry) {
            return {
                status: 'error',
                message: 'Аккаунт не найден'
            };
        }

        // Создаём экземпляр AccountManager
        const accountManager = new AccountManager(accountEntry.ID);

        // Проверяем пароль
        const isPasswordValid = await accountManager.verifyPassword(data.password);
        if (!isPasswordValid) {
            return {
                status: 'error',
                message: 'Неверный пароль'
            };
        }

        // Создаём сессию
        const deviceType = data.device_type || null;
        const device = data.device || null;
        const S_KEY = await accountManager.startSession(deviceType, device);

        return {
            status: 'success',
            S_KEY: S_KEY,
            accountID: accountEntry.ID,
            username: accountEntry.Username
        };

    } catch (err) {
        console.error('❌ Ошибка логина:', err);
        return {
            status: 'error',
            message: 'Произошла ошибка при входе'
        };
    }
};

export default login;
