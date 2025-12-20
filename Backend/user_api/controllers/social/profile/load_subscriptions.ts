import { dbE } from '../../../../lib/db.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const load_subscriptions = async ({ data }) => {
    const { username, start_index = 0 } = data.payload || {};
    const limit = 25;

    const userData: any = await AccountDataHelper.getDataFromUsername(username);

    if (!userData) {
        return RouterHelper.error('Такого пользователя нет');
    }

    const subs = await dbE.query(
        `SELECT * FROM subscriptions 
         WHERE User = ? AND TargetType = ? 
         ORDER BY Date DESC 
         LIMIT ?, ?`,
        [userData.id, userData.type, start_index, limit]
    );

    const result = [];

    for (const row of subs) {
        const targetData = await dbE.query(`SELECT * FROM accounts WHERE ID = ?`, [row.Target]);
        if (targetData.length === 0) continue;

        const user = targetData[0];
        result.push({
            id: row.ID,
            name: user.Name,
            username: user.Username,
            avatar: user.Avatar,
            posts: user.Posts,
            subscribers: user.Subscribers,
            date: row.Date
        });
    }

    return RouterHelper.success({
        users: result
    });
}

export default load_subscriptions;
