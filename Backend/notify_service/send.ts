import webPush from 'web-push';
import AccountDataHelper from '../services/account/AccountDataHelper.js';
import { getDate } from '../system/global/Function.js';
import { getSession, sendMessageToUser } from '../system/global/AccountManager.js';
import { sendAES } from '../system/global/Crypto.js';
import Config from '../system/global/Config.js';
import { dbE } from '../lib/db.js';

webPush.setVapidDetails(
    'mailto:elemsupport@proton.me',
    Config.VAPID.PUBLIC_KEY,
    Config.VAPID.PRIVATE_KEY
);

export async function send(uid, payload) {
    try {
        if (!uid || !payload?.from || !payload?.action || !payload?.content) {
            throw new Error('Недостаточно данных для отправки уведомления');
        }

        const isValidSender = await AccountDataHelper.validateAccount(uid);
        const isValidReceiver = await AccountDataHelper.validateAccount(payload.from);

        if (!isValidSender || !isValidReceiver) {
            throw new Error('Некорректный идентификатор пользователя');
        }

        const notificationExists = await dbE.query(
            'SELECT COUNT(*) as count FROM notifications WHERE `for` = ? AND `from` = ? AND action = ? AND content = ?',
            [uid, payload.from, payload.action, JSON.stringify(payload.content)]
        );
        if (notificationExists[0].count > 0) {
            return;
        }

        const date = getDate();
        const notification = await dbE.query(
            'INSERT INTO notifications (`for`, `from`, action, content, date) VALUES (?, ?, ?, ?, ?)',
            [uid, payload.from, payload.action, JSON.stringify(payload.content), date]
        );
        const notificationsCount = await dbE.query(
            'SELECT COUNT(*) as count FROM notifications WHERE `for` = ? AND viewed = 0',
            [uid]
        );
        await dbE.query(
            'UPDATE accounts SET Notifications = ? WHERE ID = ?',
            [notificationsCount[0].count, uid]
        );
        
        const accountDataHelper = new AccountDataHelper();
        const author = await accountDataHelper.getAuthorData(payload.from);

        const subscriptions = await dbE.query(
            'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
            [uid]
        );

        const data = {
            id: notification.insertId,
            author: author,
            action: payload.action,
            content: payload.content,
            viewed: 0,
            date: date,
        }

        console.log('Отправка пуш-уведомления:', data);

        for (const sub of subscriptions) {
            try {
                await webPush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    },
                    JSON.stringify(data)
                );
            } catch (err) {
                console.error('Ошибка при пуше на', sub.endpoint, err);
            }
        }

        const session = await getSession(uid);

        if (session && session.connection) {
            sendMessageToUser({
                uid: uid,
                message: await sendAES({
                    data: {
                        type: 'social',
                        action: 'notify',
                        notification: data
                    },
                    key: session.aesKey
                })
            })
        }
    } catch (error) {
        console.error('Ошибка при отправке уведомления:', error);
    }
}