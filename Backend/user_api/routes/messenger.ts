import { aesDecryptUnit8, aesEncryptUnit8 } from '../../system/global/Crypto.js';
import { updateSession } from '../../system/global/AccountManager.js';
import loadChats from '../controllers/messenger/load_chats.js';
import loadChat from '../controllers/messenger/load_chat.js';
import loadMessages from '../controllers/messenger/load_messages.js';
import sendMessage from '../controllers/messenger/send_message.js';
import deleteAllChats from '../controllers/messenger/delete_all_chats.js';
import uploadFile from '../controllers/messenger/upload_file.js';
import downloadFile from '../controllers/messenger/download_file.js';
import viewMessages from '../controllers/messenger/view_messages.js';
import createGroup from '../controllers/messenger/group/create.js';
import AppError from '../../services/system/AppError.js';
import loadGroupMembers from '../controllers/messenger/group/load_members.js';
import loadGroup from '../controllers/messenger/group/load_group.js';
import joinGroup from '../controllers/messenger/group/join.js';
import generateGroupLink from '../controllers/messenger/group/generate_link.js';
import { dbE, dbM } from '../../lib/db.js';

const connectMesKey = async ({ account, data }) => {
    try {
        const check = async () => {
            const encryptedText = aesEncryptUnit8('боже фурри такие зайки', data.key);
            if (aesDecryptUnit8(encryptedText, data.key) === 'боже фурри такие зайки') {
                const result = await dbE.query('SELECT * FROM `accounts` WHERE `ID` = ? AND `Keyword` = 1', [account.ID]);
                if (result.length < 1) {
                    await dbE.query('UPDATE `accounts` SET `Keyword` = 1 WHERE `ID` = ?', [account.ID]);
                }
                const lm = await dbM.query('SELECT * FROM `messages` WHERE `uid` = ? LIMIT 1', [account.ID]);
                if (lm.length > 0) {
                    if (aesDecryptUnit8(lm[0].encrypted, data.key)) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return true;
                }
            } else {
                return false;
            }
        }

        if (await check()) {
            await updateSession(account.ID, { mesKey: data.key });
            return {
                status: 'success',
                keyword: data.key
            };
        } else {
            return {
                status: 'error',
                content: 'Ключ либо не соответствует требованиям, либо вы ввели неверный ключ.'
            };
        }
    } catch (error) {
        console.log('Ошибка при проверке ключа:' + error);
        return false;
    }
}

const deleteAll = async ({ account }) => {
    await deleteAllChats({ uid: account.ID });
    return { status: 'success', text: 'Все чаты успешно удалены.' };
}

const routes = {
    delete_all_chats: { h: deleteAll, useAccount: true },

    aes_messages_key: { h: connectMesKey },
    load_chat: { h: loadChat },
    load_chats: { h: loadChats },
    load_messages: { h: loadMessages },
    send_message: { h: sendMessage },
    view_messages: { h: viewMessages },
    upload_file: { h: uploadFile },
    download_file: { h: downloadFile },

    // группы
    create_group: { h: createGroup },
    load_group: { h: loadGroup },
    load_group_members: { h: loadGroupMembers },
    join_group: { h: joinGroup },
    generate_group_link: { h: generateGroupLink },
};

const flatRoutes = new Map();

const flattenRoutes = (obj, path = '') => {
    for (const key in obj) {
        const value = obj[key];
        const newPath = path ? `${path}/${key}` : key;

        if (value && typeof value.h === 'function') {
            flatRoutes.set(newPath, value);
        } else if (typeof value === 'object' && value !== null) {
            flattenRoutes(value, newPath);
        }
    }
};

flattenRoutes(routes);

const social = async (ws, action, data) => {
    try {
        const route = flatRoutes.get(action);

        if (!route) {
            return { status: 'error', message: 'Такого действия нет' };
        }

        if (route.useAccount && !ws?.account?.ID) {
            return { status: 'error', message: 'Вы не вошли в аккаунт' };
        }

        if (route.permission && !ws?.account?.permissions?.[route.permission]) {
            return { status: 'error', message: 'У вас нет прав на это действие' };
        }

        const result = await route.h({ account: ws.account, data });

        return { action, ...result };
    } catch (error) {
        console.log(error);

        if (error instanceof AppError) {
            return { status: 'error', message: error.message };
        }
        return {
            status: 'error',
            message: 'Внутренняя ошибка сервера'
        };
    }
};

export default social;
