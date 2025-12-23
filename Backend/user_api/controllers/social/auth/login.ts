import AccountManager from '../../../../system/global/AccountManager.js';
import Validator from '../../../../services/system/Validator.js';

const login = async ({ data }) => {
    try {
        const validator = new Validator();
        await validator.validateEmail(data.email);
        validator.validateText({ title: 'Пароль', value: data.password, maxLength: 100 });

        // Поиск аккаунта в памяти
        let accountId = null;
        for (const [id, acc] of AccountManager.memory.accounts.entries()) {
            if (acc.Email.toLowerCase() === data.email.toLowerCase()) {
                accountId = id;
                break;
            }
        }

        if (!accountId) {
            return { status: 'error', message: 'Аккаунт не найден' };
        }

        const accountManager = new AccountManager(accountId);
        const isPasswordValid = await accountManager.verifyPassword(data.password);

        if (!isPasswordValid) {
            return { status: 'error', message: 'Неверный пароль' };
        }

        const S_KEY = await accountManager.startSession(data.device_type, data.device);

        return {
            status: 'success',
            S_KEY,
            accountID: accountId,
            username: accountManager.accountData.Username
        };

    } catch (err) {
        console.error('❌ Ошибка логина:', err);
        return { status: 'error', message: 'Произошла ошибка при входе' };
    }
};

export default login;
