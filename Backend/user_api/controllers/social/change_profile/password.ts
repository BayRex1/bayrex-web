import AccountManager from '../../../../services/account/AccountManager.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import Validator from '../../../../services/system/Validator.js';

const password = async ({ account, data }) => {
    const { old_password, new_password } = data;

    const accountManager = new AccountManager(account.ID);
    const validator = new Validator();

    validator.validateText({
        title: 'Старый пароль',
        value: old_password,
        maxLength: 100
    })

    validator.validateText({
        title: 'Новый пароль',
        value: new_password,
        maxLength: 100
    })

    if (!await accountManager.verifyPassword(old_password)) {
        return RouterHelper.error('Неверный старый пароль')
    }

    const answer = await accountManager.changePassword(new_password);

    return answer;
}

export default password;