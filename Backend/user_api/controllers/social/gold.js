import { dbE } from '../../../lib/db.js';
import AccountManager from '../../../services/account/AccountManager.js';
import { updateAccount } from '../../../system/global/AccountManager.js';
import { getDate } from '../../../system/global/Function.js';

export const goldPay = async ({ account }) => {
    if (!account) return;
    if (account.Eballs < 0.1) return { status: 'error', message: 'Недостаточно е-баллов' }

    const accountManager = new AccountManager(account.ID);
    const status = await accountManager.getGoldStatus();

    if (status && status.activated === true) {
        return { status: 'error', message: 'У вас уже есть подписка' }
    }

    updateAccount({
        id: account.ID,
        value: 'Eballs',
        data: account.Eballs - 0.1,
    })

    await dbE.query('INSERT INTO `gold_subs` (`uid`, `received`, `date`) VALUES (?, ?, ?)', [account.ID, 'eballs', getDate()]);

    return { status: 'success' }
}

export const goldActivate = async ({ account, data }) => {
    if (!account) return;
    if (!data.code) return { status: 'error', message: 'Введите код' }

    const result = await dbE.query('SELECT * FROM `gold_codes` WHERE `code` = ? AND `activated` = 0', [data.code]);

    if (!result.length) return { status: 'error', message: 'Такого кода не существует, или он уже активирован' }

    const accountManager = new AccountManager(account.ID);
    const status = await accountManager.getGoldStatus();

    if (status && status.activated === true) {
        return { status: 'error', message: 'У вас уже есть подписка' }
    }

    await dbE.query("UPDATE `gold_codes` SET `activated` = 1 WHERE `code` = ?", [data.code]);
    await dbE.query('INSERT INTO `gold_subs` (`uid`, `received`, `date`) VALUES (?, ?, ?)', [account.ID, 'code', getDate()]);

    return { status: 'success' }
}