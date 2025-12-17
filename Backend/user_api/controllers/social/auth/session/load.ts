import { dbE } from '../../../../../lib/db.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';
import { getSession } from '../../../../../system/global/AccountManager.js';

const load = async ({ account }) => {
    const rows = await dbE.query('SELECT * FROM `accounts_sessions` WHERE `uid` = ?', [account.ID]);

    const session = await getSession(account.ID);

    const sessions = rows.map((session) => ({
        id: session.id,
        device_type: session.device_type,
        device: session.device,
        create_date: session.create_date,
    }));

    const currentSession = await dbE.query('SELECT * FROM `accounts_sessions` WHERE `S_KEY` = ?', [session.S_KEY]);

    return RouterHelper.success({
        status: 'success',
        current_session: {
            id: currentSession[0].id,
            device_type: currentSession[0].device_type,
            device: currentSession[0].device,
            create_date: currentSession[0].create_date,
        },
        sessions
    });
}

export default load;
