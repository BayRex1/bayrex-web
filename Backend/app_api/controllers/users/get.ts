import { dbA, dbE } from '../../../lib/db.js';
import AccountDataHelper from '../../../services/account/AccountDataHelper.js';
import LinkManager from '../../../services/account/LinkManager.js';
import FoxToken from '../../../services/system/FoxToken.js';
import { getSession } from '../../../system/global/AccountManager.js';

export const get_all_users = async ({ app }) => {
    if (!app) return;

    const connects = await dbA.query('SELECT * FROM `connects` WHERE `app_id` = ?', [app.id]);
    const users = [];

    for (const connect of connects) {
        const user = await dbE.query('SELECT * FROM `accounts` WHERE `ID` = ?', [connect.uid]);
        if (user[0]) {
            const accountDataHelper = new AccountDataHelper();
            const linkManager = new LinkManager(user[0].ID);
            const session = await getSession(user[0].ID);
            
            users.push({
                id: user[0].ID,
                name: user[0].Name,
                username: user[0].Username,
                avatar: user[0].Avatar,
                cover: user[0].Cover,
                description: user[0].Description,
                links_count: user[0].Links,
                last_online: user[0].last_online,
                create_date: user[0].CreateDate,
                online: (session && session.connection) ? true : false,
                icons: await accountDataHelper.getIcons(user[0].ID) || null,
                links: await linkManager.getLinks()
            });
        }
    }
    return {
        status: 'success',
        users: users
    };
}

export const get_user = async ({ app, data }) => {
    if (!data.connect_key) return;
    const headerBase64 = data.connect_key.split('.')[0];
    const uid = Buffer.from(headerBase64, 'base64').toString('utf-8');

    const connect = await dbA.query('SELECT * FROM `connects` WHERE `app_id` = ? AND `uid` = ?', [app.id, uid]);

    if (!connect[0]) return { status: 'error', message: 'Ошибка ключа' };

    if (await FoxToken.verifyToken(data.connect_key, connect[0].secret_id)) {
        const user = await dbE.query('SELECT * FROM `accounts` WHERE `ID` = ?', [connect[0].uid]);
        const accountDataHelper = new AccountDataHelper();
        const linkManager = new LinkManager(user[0].ID);
        const session = await getSession(user[0].ID);
        
        return {
            status:'success',
            user: {
                id: user[0].ID,
                name: user[0].Name,
                username: user[0].Username,
                avatar: user[0].Avatar,
                cover: user[0].Cover,
                description: user[0].Description,
                links_count: user[0].Links,
                last_online: user[0].last_online,
                create_date: user[0].CreateDate,
                online: (session && session.connection) ? true : false,
                icons: await accountDataHelper.getIcons(user[0].ID) || null,
                links: await linkManager.getLinks()
            }
        }
    } else {
        return { status: 'error', message: 'Ошибка токена' };
    }
                                   }
