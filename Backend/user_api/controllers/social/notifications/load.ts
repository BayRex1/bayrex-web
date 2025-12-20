import { dbE } from '../../../../lib/db.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const accountDataHelper = new AccountDataHelper();

const load = async ({ account, data }) => {
    const { start_index = 0 } = data.payload || {};

    let notifications = [];

    const rows = await dbE.query(
        'SELECT * FROM notifications WHERE `for` = ? ORDER BY `date` DESC LIMIT ?, 25',
        [account.ID, start_index]
    );

    if (rows && rows.length > 0) {
        for (const row of rows) {
            const author = await accountDataHelper.getAuthorData(row.from);

            if (author) {
                notifications.push({
                    id: row.id,
                    author: author,
                    action: row.action,
                    content: (() => {
                        try {
                            return JSON.parse(row.content);
                        } catch {
                            return null;
                        }
                    })(),
                    viewed: row.viewed,
                    date: row.date,
                })
            }
        }
    }

    return RouterHelper.success({
        notifications: notifications
    })
}

export default load;
