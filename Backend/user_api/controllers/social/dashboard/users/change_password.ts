import AccountManager from '../../../../../services/account/AccountManager.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';

const change_password = async ({ data }) => {
    const { uid, password = '' } = data.payload || {};
    
    if (uid == null || typeof password !== 'string' || password.trim() === '') {
        return RouterHelper.error('Пожалуйста, укажите все необходимые параметры');
    }

    const accountManager = new AccountManager(uid);
    const res = await accountManager.changePassword(password);

    if (res?.status === 'success') {
        return RouterHelper.success({ message: 'Пароль обновлён' });
    } else {
        return RouterHelper.error(res.message || 'Не удалось изменить пароль');
    }
}

export default change_password;
