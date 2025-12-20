import { dbE } from '../../../../../lib/db.js';

const recount_users = async () => {
    const users = await dbE.query('SELECT * FROM gold_subs WHERE status = 1');

    const now = new Date();

    for (const user of users) {
        const activatedDate = new Date(user.date);
        const diffTime = Math.abs(now.getTime() - activatedDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 30) {
            await dbE.query('UPDATE gold_subs SET status = 0 WHERE uid = ?', [user.uid]);
        }
    }
}

export default recount_users;
