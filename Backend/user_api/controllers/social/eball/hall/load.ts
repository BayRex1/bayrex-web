import { dbE } from '../../../../../lib/db.js';
import AccountDataHelper from '../../../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';

const accountDataHelper = new AccountDataHelper();

const load = async () => {
    const users = [];
    const rows = await dbE.query('SELECT * FROM accounts WHERE Eballs > 0 ORDER BY Eballs DESC LIMIT 100');

    for (const row of rows) {
        const icons = [];

        icons.push(...await accountDataHelper.getIcons(row.ID));

        users.push({
            id: row.ID,
            name: row.Name,
            username: row.Username,
            avatar: AccountDataHelper.getAvatar(row.Avatar),
            icons: icons,
            eballs: row.Eballs,
        });
    }

    return RouterHelper.success({
        users: users.sort((a, b) => b.eballs - a.eballs),
    });
};

export default load;
