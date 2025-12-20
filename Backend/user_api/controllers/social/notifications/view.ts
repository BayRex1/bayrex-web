import { dbE } from '../../../../lib/db.js';

const view = async ({ account }) => {
    await dbE.query(
        'UPDATE notifications SET viewed = 1 WHERE `for` = ? AND viewed = 0',
        [account.ID]
    );
}

export default view;
