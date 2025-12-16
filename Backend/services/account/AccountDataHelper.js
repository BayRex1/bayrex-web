import { dbE } from '../../lib/db.js';
import AccountManager from './AccountManager.js';

class AccountDataHelper {
    static async checkGoldStatus(uid) {
        const [{ count }] = await dbE.query(
            'SELECT COUNT(*) AS count FROM `gold_subs` WHERE `uid` = ? AND `status` = 1',
            [uid]
        );
        return count > 0;
    }

    static async getAuthorDataFromTypeAndID(type, id) {
        const tables = {
            0: 'accounts',
            1: 'channels'
        };

        const table = tables[type];
        if (!table) return false;

        const [result] = await dbE.query(
            `SELECT ID, Username, Name, Avatar FROM ${table} WHERE ID = ? LIMIT 1`,
            [id]
        );

        if (!result?.ID) return false;

        return {
            id: result.ID,
            name: result.Name,
            username: result.Username,
            avatar: AccountDataHelper.getAvatar(result.Avatar)
        };
    }

    static async getDataFromUsername(username) {
        let profileType = 0;

        let profile = await dbE.query(
            'SELECT ID FROM `accounts` WHERE `Username` = ? LIMIT 1',
            [username]
        );

        if (!profile[0]?.ID) {
            profile = await dbE.query(
                'SELECT ID FROM `channels` WHERE `Username` = ? LIMIT 1',
                [username]
            );
            if (!profile[0]?.ID) return false;
            profileType = 1;
        }

        return {
            id: profile[0].ID,
            type: profileType
        };
    }

    static getAvatar(avatar) {
        if (!avatar) return null;
        if (typeof avatar === 'string') {
            try {
                return JSON.parse(avatar);
            } catch {
                return null;
            }
        }
        return avatar;
    }

    static getCover(cover) {
        if (!cover) return null;
        if (typeof cover === 'string') {
            try {
                return JSON.parse(cover);
            } catch {
                return null;
            }
        }
        return cover;
    }

    async getAuthorData(uid) {
        const accounts = await dbE.query(
            'SELECT `ID`, `Name`, `Username`, `Avatar` FROM `accounts` WHERE `ID` = ? LIMIT 1',
            [uid]
        );

        if (!accounts || accounts.length === 0) {
            return false;
        }

        const account = accounts[0];

        return {
            id: account.ID,
            name: account.Name,
            username: account.Username,
            avatar: AccountDataHelper.getAvatar(account.Avatar)
        };
    }

    async getAuthorDataFromPost(postID) {
        try {
            const posts = await dbE.query(
                'SELECT `author_type`, `author_id` FROM `posts` WHERE `ID` = ? LIMIT 1',
                [postID]
            );

            if (!posts || posts.length === 0) {
                return false;
            }

            const postData = posts[0];
            let authorQuery = '';
            if (postData.author_type === 0) {
                authorQuery = 'SELECT `ID`, `Name`, `Username`, `Avatar` FROM `accounts` WHERE `ID` = ? LIMIT 1';
            } else if (postData.author_type === 1) {
                authorQuery = 'SELECT `ID`, `Name`, `Username`, `Avatar` FROM `channels` WHERE `ID` = ? LIMIT 1';
            } else {
                return false;
            }

            const authors = await dbE.query(authorQuery, [postData.author_id]);

            if (!authors || authors.length === 0) {
                return false;
            }

            return {
                type: postData.author_type,
                data: authors[0],
            };
        } catch (error) {
            console.error('Ошибка в getAuthorDataFromPost:', error);
            return false;
        }
    }

    async getIcons(uid) {
        const icons = [];
        const accountManager = new AccountManager(uid);
        const res = await dbE.query('SELECT * FROM `icons` WHERE `UserID` = ?', [uid]);
        
        const status = await accountManager.getGoldStatus();
        if (status && status.activated) {
            icons.push({
                icon_id: 'GOLD',
                date_get: status.date_get
            });
        }

        const existingIconIds = icons.map(icon => icon.icon_id);
        
        res.forEach(icon => {
            if (!existingIconIds.includes(icon.IconID)) {
                icons.push({
                    icon_id: icon.IconID,
                    date_get: icon.Date
                });
            }
        });

        return icons;
    }

    static async validateAccount(uid) {
        const [{ count }] = await dbE.query(
            'SELECT COUNT(*) AS count FROM `accounts` WHERE `ID` = ?',
            [uid]
        );
        return count > 0;
    }

    async checkBlock(uid, a_id, a_type) {
        const [{ count }] = await dbE.query(
            'SELECT COUNT(*) AS count FROM `blocked` WHERE `uid` = ? AND `author_id` = ? AND `author_type` = ?',
            [uid, a_id, a_type]
        );
        return count > 0;
    }

    async checkSubscription(uid, data) {
        const [{ count }] = await dbE.query(
            'SELECT COUNT(*) AS count FROM `subscriptions` WHERE `User` = ? AND `Target` = ? AND `TargetType` = ?',
            [uid, data.id, data.type]
        );
        return count > 0;
    }
}

export default AccountDataHelper;
