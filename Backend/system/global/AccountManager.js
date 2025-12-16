import { Redis } from 'ioredis';
import { checkValidUID, getDate } from './Function.js';
import { dbE } from '../../lib/db.js';

const redis = new Redis();
const activeConnections = {};

const redisRetry = async (fn, retries = 3) => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error) {
            attempt++;
            console.error(`Ошибка Redis, попытка ${attempt}: ${error.message}`);
            if (attempt >= retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};

export const createSession = async ({ id, ws, data }) => {
    try {
        await redisRetry(() => redis.set(`session:${id}`, JSON.stringify(data)));
        activeConnections[id] = { ws: ws, lastActive: Date.now() };
    } catch (error) {
        console.error(`Ошибка при создании сессии для пользователя ${id}:`, error);
    }
};

export const getSession = async (id) => {
    return await redisRetry(async () => {
        const sessionData = await redis.get(`session:${id}`);

        return {
            ...(sessionData ? JSON.parse(sessionData) : {}),
            connection: activeConnections[id] || null
        };
    });
};

export const sendMessageToUser = ({ uid, message }) => {
    const connection = activeConnections[uid];
    if (connection && connection.ws.readyState === connection.ws.OPEN) {
        connection.ws.send(message);
    } else {
        console.log(`Пользователь с ID ${uid} не подключен.`);
    }
};

export const deleteSession = async (id) => {
    await redis.del(`session:${id}`);
    delete activeConnections[id];
}

export const getSessions = () => {
    return activeConnections;
}

export const updateSession = async (id, newData) => {
    const sessionKey = `session:${id}`;
    const currentData = await getSession(id);
    const updatedData = currentData ? { ...currentData, ...newData } : newData;
    
    const { connection, ws, ...serializableData } = updatedData;
    
    await redis.set(sessionKey, JSON.stringify(serializableData));
}

export const updateAccount = async ({ id, value, data }) => {
    if (!checkValidUID(id)) return;

    await dbE.query(`UPDATE accounts SET ${value} = ? WHERE ID = ?`, [data, id]);
    const currentSession = await getSession(id) || {};
    currentSession[value] = data; 

    await updateSession(id, currentSession);
}

export const connectAccount = async ({ S_KEY, ws }) => {
    const session = await dbE.query('SELECT * FROM `accounts_sessions` WHERE `s_key` = ?', [S_KEY]);

    if (!session || session.length === 0 || !session[0].uid) return false;

    const result = await dbE.query('SELECT * FROM `accounts` WHERE `ID` = ?', [session[0].uid]);

    if (result.length > 0) {
        const uid = result[0].ID;
        await createSession({
            id: uid,
            ws: ws,
            data: result[0]
        });
        await updateSession(uid, {
            aesKey: ws.keys.user.aes,
            S_KEY: S_KEY
        });
        await updateAccount({
            id: uid,
            value: 'last_online',
            data: getDate()
        });
        return result[0];
    } else {
        return false;
    }
};
