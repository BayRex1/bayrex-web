import axios from 'axios';
import bcrypt from 'bcryptjs';
import Config from '../../../../system/global/Config.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import Validator from '../../../../services/system/Validator.js';
import AccountManager from '../../../../services/account/AccountManager.js';
import { getDate } from '../../../../system/global/Function.js';
import { dbE } from '../../../../lib/db.js';

export const reg = async ({ data }) => {
    if (!Config.REGISTRATION) {
        return RouterHelper.error('Регистрация отключена, попробуйте позже');
    }

    let username = data.username?.replace('@', '') || null;

    const validator = new Validator();

    validator.validateText({ title: 'Имя', value: data.name, maxLength: 60 });
    validator.validateText({ title: 'Уникальное имя', value: username, maxLength: 40 });
    validator.validateText({ title: 'Пароль', value: data.password, maxLength: 100 });
    await validator.validateUsername(username);
    await validator.validateEmail(data.email, true);

    if (!data.accept || data.accept !== true) {
        return RouterHelper.error('Вы должны принять правила');
    }

    if (Config.CAPTCHA) {
        if (!data.h_captcha) {
            return RouterHelper.error('Вы не прошли капчу');
        }

        const params = new URLSearchParams();
        params.append('secret', Config.CAPTCHA_KEY);
        params.append('response', data.h_captcha);

        const captchaRes = await axios.post(
            Config.CAPTCHA_URL,
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        if (!captchaRes.data.success) {
            return RouterHelper.error('Вы не прошли капчу');
        }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const answer = await dbE.query('INSERT INTO `accounts` (`Name`, `Username`, `Email`, `Password`, `CreateDate`) VALUES (?, ?, ?, ?, ?)', [
        data.name,
        username,
        data.email,
        hashedPassword,
        getDate()
    ]);

    const AccountManagerInstance = new AccountManager(answer.insertId);
    const S_KEY = await AccountManagerInstance.startSession(data.device_type, data.device);

    return RouterHelper.success({
        S_KEY,
        accountID: answer.insertId
    });
};

export default reg;
