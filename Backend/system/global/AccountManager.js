import { checkValidUID, getDate } from './Function.js';
import { dbE } from '../../lib/db.js';

// ⬇⬇⬇ ЗАМЕНЯЕМ REDIS НА ПАМЯТЬ ⬇⬇⬇
console.log('🎯 AccountManager: используем память вместо Redis');

const memoryStorage = new Map(); // Храним сессии в памяти
const activeConnections = {};

// Заглушка для совместимости (если другие модули импортируют redis)
export const redis = {
  set: async (key, value) => {
    console.log(`📦 MemoryStorage.set("${key}")`);
    memoryStorage.set(key, value);
    return 'OK';
  },
  
  get: async (key) => {
    console.log(`📦 MemoryStorage.get("${key}")`);
    return memoryStorage.get(key) || null;
  },
  
  del: async (key) => {
    console.log(`📦 MemoryStorage.del("${key}")`);
    memoryStorage.delete(key);
    return 1;
  },
  
  // Для совместимости с оригинальным кодом
  on: () => redis
};

// Заглушка для retry функции (она больше не нужна, но оставляем для совместимости)
const redisRetry = async (fn, retries = 3) => {
  try {
    return await fn();
  } catch (error) {
    console.error('Ошибка в memoryStorage:', error.message);
    throw error;
  }
};

export const createSession = async ({ id, ws, data }) => {
  try {
    // Сохраняем в память вместо Redis
    const sessionKey = `session:${id}`;
    memoryStorage.set(sessionKey, JSON.stringify(data));
    activeConnections[id] = { ws: ws, lastActive: Date.now() };
    
    console.log(`✅ Сессия создана для пользователя ${id}`);
  } catch (error) {
    console.error(`Ошибка при создании сессии для пользователя ${id}:`, error);
  }
};

export const getSession = async (id) => {
  try {
    const sessionKey = `session:${id}`;
    const sessionData = memoryStorage.get(sessionKey);
    
    return {
      ...(sessionData ? JSON.parse(sessionData) : {}),
      connection: activeConnections[id] || null
    };
  } catch (error) {
    console.error(`Ошибка при получении сессии ${id}:`, error);
    return null;
  }
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
  const sessionKey = `session:${id}`;
  memoryStorage.delete(sessionKey);
  delete activeConnections[id];
  console.log(`🗑️  Сессия удалена: ${id}`);
};

export const getSessions = () => {
  return activeConnections;
};

export const updateSession = async (id, newData) => {
  const sessionKey = `session:${id}`;
  const currentData = await getSession(id);
  const updatedData = currentData ? { ...currentData, ...newData } : newData;
  
  const { connection, ws, ...serializableData } = updatedData;
  
  memoryStorage.set(sessionKey, JSON.stringify(serializableData));
  console.log(`🔄 Сессия обновлена: ${id}`);
};

export const updateAccount = async ({ id, value, data }) => {
  if (!checkValidUID(id)) return;

  await dbE.query(`UPDATE accounts SET ${value} = ? WHERE ID = ?`, [data, id]);
  const currentSession = await getSession(id) || {};
  currentSession[value] = data; 

  await updateSession(id, currentSession);
};

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
      aesKey: ws.keys?.user?.aes, // Добавляем опциональную цепочку
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

console.log('✅ AccountManager готов (режим без Redis)');
