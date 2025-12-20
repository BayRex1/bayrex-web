import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const push_sub = async ({ account, data }) => {
    const { endpoint, expirationTime, keys } = data.payload || {};

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return RouterHelper.error('Неполная информация для push-подписки');
    }

    await dbE.query(
        `INSERT INTO push_subscriptions
     (user_id, endpoint, expiration_time, p256dh, auth)
   VALUES (?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE
     expiration_time = VALUES(expiration_time),
     p256dh          = VALUES(p256dh),
     auth            = VALUES(auth)`,
        [
            account.ID,
            endpoint,
            expirationTime,
            keys.p256dh,
            keys.auth
        ]
    );

    return RouterHelper.success();
};

export default push_sub;
