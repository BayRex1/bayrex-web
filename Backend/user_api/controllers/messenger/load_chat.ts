import { getSession } from '../../../system/global/AccountManager.js';
import { createError } from '../../../system/global/Function.js';
import GroupManager from '../../../services/messenger/GroupManager.js';
import { dbE, dbM } from '../../../lib/db.js';

const userStatus = async (uid) => {
    const session = await getSession(uid);

    if (session && session.connection) {
        return 'online';
    } else {
        return 'offline';
    }
}

const loadChat = async ({ account, data }) => {
    if (!account) { createError('Аккаунт не найден') }
    if (!data.target.id) { createError('Чат не указан') }
    if (!data.target.type) { createError('Тип чата не указан') }
    if (!data.username) { createError('Пользователь не найден') }

    let chatQuery: string;
    let chatTypeCode: number;

    if (data.target.type === 0) {
        chatTypeCode = 0;
        chatQuery = 'SELECT * FROM `accounts` WHERE `ID` = ?';
    } else if (data.target.type === 1) {
        chatTypeCode = 1;
        chatQuery = 'SELECT * FROM `groups` WHERE `id` = ?';
    } else {
        return createError('Неверный тип чата');
    }

    if (chatTypeCode === 0) {
        const chatData = await dbE.query(chatQuery, [data.target.id]);

        if (chatData.length < 0) return createError('Чат не найден');

        return {
            status: 'success',
            chat_data: {
                id: chatData[0].ID,
                type: chatTypeCode,
                user_data: {
                    id: chatData[0].ID,
                    username: chatData[0].Username,
                    name: chatData[0].Name,
                    avatar: chatData[0].Avatar,
                    status: await userStatus(chatData[0].ID)
                }
            }
        };
    }
    if (chatTypeCode === 1) {
        const chatData = await dbM.query(chatQuery, [data.target.id]);

        if (chatData.length < 0) return createError('Группа не найдена');

        const groupManager = new GroupManager(account.ID);
        const isJoined = await groupManager.validateMember(chatData[0].id);
        const isOwner = await groupManager.isOwner(chatData[0].id);

        if (!isJoined) return createError('Группа не найдена');

        return {
            status: 'success',
            chat_data: {
                id: chatData[0].id,
                type: chatTypeCode,
                user_data: {
                    id: chatData[0].id,
                    username: null,
                    name: chatData[0].name,
                    avatar: JSON.parse(chatData[0].avatar),
                },
                join_link: await groupManager.getLink(chatData[0].id),
                ...(isOwner ? { is_owner: true } : {})
            }
        };
    }
}

export default loadChat;