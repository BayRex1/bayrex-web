import { dbE } from '../../../../lib/db.js';
import AccountManager from '../../../../services/account/AccountManager.js';
import Validator from '../../../../services/system/Validator.js';

const login = async ({ data }) => {

    const validator = new Validator();

    await validator.validateEmail(data.email);
    validator.validateText({ title: 'Пароль', value: data.password, maxLength: 100 });

    const rows = await dbE.query('SELECT * FROM `accounts` WHERE `Email` = ?', [data.email]);

    if (rows.length > 0) {
        const account = rows[0];
        const accountManager = new AccountManager(account.ID);

        const isPasswordValid = await accountManager.verifyPassword(data.password);
        if (!isPasswordValid) {
            return {
                status: 'error',
                message: 'Неверный пароль'
            }
        }

        const deviceType = data.device_type || null;
        const device = data.device || null;

        const S_KEY = await accountManager.startSession(deviceType, device);

        return {
            status: 'success',
            S_KEY: S_KEY,
            accountID: account.ID
        }
    } else {
        return {
            status: 'error',
            message: 'Аккаунт не найден'
        }
    }
}

export default login;