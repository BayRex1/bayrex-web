import { dbE } from '../../../../lib/db.js';
import { send } from '../../../../notify_service/send.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { getDate } from '../../../../system/global/Function.js';

const recountSubscribers = async (data) => {
    const res = await dbE.query(
        'SELECT COUNT(*) AS Count FROM subscriptions WHERE Target = ? AND TargetType = ?',
        [data.id, data.type]
    );
    const count = res[0].Count;

    const updateQuery = data.type === 0
        ? 'UPDATE accounts SET Subscribers = ? WHERE ID = ?'
        : 'UPDATE channels SET Subscribers = ? WHERE ID = ?';

    await dbE.query(updateQuery, [count, data.id]);
};

const recountSubscriptions = async (account) => {
    const res = await dbE.query(
        'SELECT COUNT(*) AS Count FROM subscriptions WHERE User = ? AND TargetType = 0',
        [account.ID]
    );
    const count = res[0].Count;

    await dbE.query('UPDATE accounts SET Subscriptions = ? WHERE ID = ?', [count, account.ID]);
};

const subscribe = async ({ account, data }) => {
    const { username } = data.payload || {};

    if (!username) {
        return RouterHelper.error('И на кого подписываться?');
    }

    const userData: any = await AccountDataHelper.getDataFromUsername(username);

    if (!userData) {
        return RouterHelper.error('Такого пользователя нет');
    }

    if (userData.type === 0 && userData.id === account.ID) {
        return RouterHelper.error('Нельзя на себя подписаться');
    }

    const existingSubs = await dbE.query(
        'SELECT * FROM subscriptions WHERE User = ? AND Target = ? AND TargetType = ?',
        [account.ID, userData.id, userData.type]
    );

    if (existingSubs.length === 0) {
        await dbE.query(
            'INSERT INTO subscriptions (User, Target, TargetType, Date) VALUES (?, ?, ?, ?)',
            [account.ID, userData.id, userData.type, getDate()]
        );

        if (userData.type === 0) {
            send(userData.id, {
                from: account.ID,
                action: 'ProfileSubscribe',
                content: {
                    profile: {
                        id: account.ID,
                        username: account.Username,
                    }
                }
            });
        }
    } else {
        const subID = existingSubs[0].ID;
        await dbE.query('DELETE FROM subscriptions WHERE ID = ?', [subID]);
        send(userData.id, {
            from: account.ID,
            action: 'ProfileUnsubscribe',
            content: {
                profile: {
                    id: account.ID,
                    username: account.Username,
                }
            }
        });
    }

    await recountSubscribers(userData);
    await recountSubscriptions(account);

    return RouterHelper.success();
}

export default subscribe;
