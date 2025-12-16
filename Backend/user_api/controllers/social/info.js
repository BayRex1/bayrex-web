import { dbE } from '../../../lib/db.js';
import { getSessions } from '../../../system/global/AccountManager.js';

export const getOnlineUsers = async () => {
    const sessions = getSessions();
    const ids = Object.keys(sessions);
    const users = [];

    if (ids.length === 0) return { users: [] };

    for (const id of ids) {
        const userData = await dbE.query('SELECT * FROM `accounts` WHERE `ID` = ?', [id])
        if (userData) {
            users.push({
                id: userData[0].ID,
                name: userData[0].Name,
                username: userData[0].Username,
                avatar: userData[0].Avatar
            });
        }
    }

    return {
        users: users
    }
}