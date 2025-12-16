import { dbE, dbM } from '../../../lib/db.js';

const deleteAllChats = async ({ uid }) => {
    const chatsDM = await dbM.query('SELECT * FROM `chats_dm` WHERE `uid_1` = ? OR `uid_2` = ?', [uid, uid]);

    for (const chat of chatsDM) {
        const messages = await dbM.query('SELECT * FROM `messages_structure` WHERE `chat_id` = ? AND `chat_type` = 0', [chat.ID]);

        for (const message of messages) {
            const messagesCount = await dbM.query('SELECT * FROM `messages` WHERE `mid` = ?', [message.mid]);

            if (messagesCount > 0) {
                const targetMessage = await dbM.query('SELECT * FROM `messages` WHERE `mid` = ? AND `uid` = ?', [message.mid, uid]);

                if (targetMessage.length > 0) {
                    await dbM.query('DELETE FROM `messages` WHERE `mid` = ? AND `uid` = ?', [message.mid, uid]);
                    const targetMessage = await dbM.query('SELECT * FROM `messages` WHERE `mid` = ? AND `uid` = ?', [message.mid, uid]);

                    if (targetMessage.length < 1) {
                        const messageNotSent = await dbM.query('SELECT * FROM `messages_notsent` WHERE `mid` = ?', [message.mid]);

                        if (messageNotSent.length < 1) {
                            await dbM.query('DELETE FROM `messages_structure` WHERE `mid` = ?', [message.mid]);
                        };
                    }
                }
            } else {
                const messageNotSent = await dbM.query('SELECT * FROM `messages_notsent` WHERE `mid` = ?', [message.mid]);

                if (messageNotSent.length < 1) {
                    await dbM.query('DELETE FROM `messages_structure` WHERE `mid` = ?', [message.mid]);
                }
            }
        }

        await dbM.query('DELETE FROM `chats` WHERE `chat_id` = ? AND `chat_type` = 0', [chat.ID]);

        const chats = await dbM.query('SELECT * FROM `chats` WHERE `chat_id` = ? AND `chat_type` = 0', [chat.ID]);

        if (chats.length < 1) {
            await dbM.query('DELETE FROM `chats_dm` WHERE `ID` = ?', [chat.ID]);
        }
    }

    await dbM.query('DELETE FROM `messages` WHERE `uid` = ?', [uid]);
    await dbE.query('UPDATE `accounts` SET `Keyword` = 0 WHERE `ID` = ?', [uid]);
}

export default deleteAllChats;