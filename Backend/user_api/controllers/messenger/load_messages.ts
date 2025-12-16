import { getSession } from '../../../system/global/AccountManager.js';
import { getChatData } from '../../../system/global/Function.js';
import { aesEncryptUnit8 } from '../../../system/global/Crypto.js';
import AccountDataHelper from '../../../services/account/AccountDataHelper.js';
import GroupManager from '../../../services/messenger/GroupManager.js';
import { dbM } from '../../../lib/db.js';

const loadMessages = async ({ account, data }) => {
    const session = await getSession(account.ID);
    const mesKey = session?.mesKey;
    if (!mesKey) return null;

    const chatData = await getChatData({
        account,
        target: { type: data.target.type, id: data.target.id },
        create: false,
        message: '',
        isMedia: false,
    });
    if (!chatData) return { status: 'error', message: 'Чат не найден' };

    if (chatData.type === 1) {
        const groupManager = new GroupManager(account.ID);
        const isJoined = await groupManager.validateMember(chatData.id);
        if (!isJoined)
            return { status: 'error', messages: 'У вас нет доступа к этим сообщениям' };
    }

    await dbM.query(
        'UPDATE `chats` SET `notifications` = 0 WHERE `uid` = ? AND `chat_id` = ? AND `chat_type` = ?',
        [account.ID, chatData.id, chatData.type]
    );

    const startIndex = parseInt(data.startIndex) || 0;

    const messages = await dbM.query(
        `
      SELECT ms.*, m.uid AS m_uid, m.encrypted AS m_encrypted, m.type AS m_type,
             mn.content AS mn_content
      FROM messages_structure ms
      LEFT JOIN messages m ON m.mid = ms.mid AND m.uid = ?
      LEFT JOIN messages_notsent mn ON mn.mid = ms.mid
      WHERE ms.chat_id = ? AND ms.chat_type = ?
      ORDER BY ms.date DESC
      LIMIT ?, 25
      `,
        [account.ID, chatData.id, chatData.type, startIndex]
    );

    const uniqueAuthorIds = [...new Set(messages.map(m => m.uid))];
    const accountDataHelper = new AccountDataHelper();

    const authorsMap = new Map();
    await Promise.all(
        uniqueAuthorIds.map(async (uid) => {
            authorsMap.set(uid, await accountDataHelper.getAuthorData(uid));
        })
    );

    const messagesArray = [];

    for (const mes of messages) {
        if (!mes.m_encrypted && mes.mn_content) {
            const encryptedMessage = Buffer.from(aesEncryptUnit8(mes.mn_content, mesKey));
            await dbM.query(
                'INSERT INTO `messages` (`uid`, `mid`, `type`, `encrypted`) VALUES (?, ?, ?, ?)',
                [account.ID, mes.mid, 1, encryptedMessage]
            );

            messagesArray.push({
                uid: mes.uid,
                mid: mes.mid,
                author: authorsMap.get(mes.uid),
                encrypted: new Uint8Array(encryptedMessage),
                version: 1,
                date: mes.date,
            });
        } else if (mes.m_encrypted) {
            messagesArray.push({
                uid: mes.uid,
                mid: mes.mid,
                author: authorsMap.get(mes.uid),
                encrypted: new Uint8Array(mes.m_encrypted),
                version: mes.m_type,
                date: mes.date,
            });
        }
    }

    return {
        status: 'success',
        messages: messagesArray,
    };
};

export default loadMessages;
