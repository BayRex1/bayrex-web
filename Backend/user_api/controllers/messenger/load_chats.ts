import { getDate } from '../../../system/global/Function.js';
import { dbE, dbM } from '../../../lib/db.js';

const createSaves = async (uid) => {
    const chat = await dbM.query('SELECT * FROM `chats_dm` WHERE `uid_1` = ? AND `uid_2` = ?', [uid, uid]);

    if (chat.length < 1) {
        let date = getDate();
        await dbM.query('INSERT INTO `chats_dm` (`uid_1`, `uid_2`, `last_message`, `last_message_date`, `create_date`) VALUES (?, ?, ?, ?, ?)', [uid, uid, 'пусто', date, date]);
        const chat = await dbM.query('SELECT * FROM `chats_dm` WHERE `uid_1` = ? AND `uid_2` = ?', [uid, uid]);
        if (uid && chat[0].ID) {
            await dbM.query('INSERT INTO `chats` (`uid`, `chat_id`, `chat_type`) VALUES (?, ?, 0)', [uid, chat[0].ID]);
        }
    }
}

const loadNotifications = async (uid, chat_id, chat_type) => {
    const result = await dbM.query(
        "SELECT COUNT(*) AS count FROM notifications WHERE chat_id = ? AND chat_type = ? AND uid = ?", 
        [chat_id, chat_type, uid]
    );
    return result[0]?.count || 0;
}

const loadChats = async ({ account }) => {
    const uid = account.ID;
    
    createSaves(uid);

    const chatsResult = await dbM.query("SELECT chat_id, chat_type FROM `chats` WHERE `uid` = ?", [uid]);
    const chats = [];

    for (const chat of chatsResult) {
        const chatDataResult = await dbM.query("SELECT * FROM `chats_dm` WHERE `ID` = ?", [chat.chat_id]);
        if (chatDataResult.length > 0) {
            const chatData = chatDataResult[0];
            const tid = (chatData.uid_1 == uid) ? chatData.uid_2 : chatData.uid_1;
            const userResult = await dbE.query("SELECT * FROM `accounts` WHERE `ID` = ?", [tid]);
            const user = userResult[0];

            chats.push({
                id: chat.chat_id,
                target: {
                    id: user.ID,
                    type: chat.chat_type
                },
                username: user.Username || 'неизвестный',
                name: user.Name || 'кто-то',
                avatar: user.Avatar || null,
                notifications: await loadNotifications(uid, chat.chat_id, chat.chat_type),
                last_message: chatData.last_message || 'пусто',
                last_message_date: chatData.last_message_date,
            });
        }
    }

    const groupsResult = await dbM.query('SELECT gid FROM `groups_members` WHERE `uid` = ?', [account.ID]);

    for (const group of groupsResult) {
        const groupDataResult = await dbM.query('SELECT * FROM `groups` WHERE `id` = ?', [group.gid]);

        if (groupDataResult.length > 0) {
            const groupData = groupDataResult[0];

            chats.push({
                id: groupData.id,
                target: {
                    id: groupData.id,
                    type: 1
                },
                name: groupData.name,
                avatar: groupData.avatar,
                notifications: await loadNotifications(uid, groupData.ID, 1),
                last_message: groupData.last_message,
                last_message_date: groupData.last_message_date
            });
        }
    }

    return {
        status: 'success',
        chats: chats
    };
};

export default loadChats;