// Function.js - упрощенная заглушка для режима без БД
console.log('📦 Function.js: РЕЖИМ ЗАГЛУШКИ');

// 1. Основные функции даты
export const getDate = () => {
    return new Date().toISOString().replace('Z', '+00:00');
};

export const getEndDate = (hours) => {
    const date = new Date(Date.now() + (parseInt(hours) || 24) * 60 * 60 * 1000);
    return date.toISOString().replace('Z', '+00:00');
};

// 2. Заглушки для сессий (должны быть в AccountManager.js)
export const getSession = async (uidOrKey) => {
    console.log(`📦 getSession заглушка: ${uidOrKey}`);
    
    // Возвращаем фиктивную сессию
    return {
        ID: typeof uidOrKey === 'number' ? uidOrKey : 1,
        uid: typeof uidOrKey === 'number' ? uidOrKey : 1,
        s_key: typeof uidOrKey === 'string' ? uidOrKey : 'mock_session_key',
        aesKey: 'mock_aes_key_for_testing',
        mesKey: 'mock_mes_key_for_testing',
        connection: null
    };
};

// 3. Заглушка для sendMessageToUser
export const sendMessageToUser = async (params) => {
    console.log('📦 sendMessageToUser заглушка:', params);
    return { success: true };
};

// 4. Заглушки для ID и валидации
export const createMesID = async (length = 6) => {
    let id = '';
    for (let i = 0; i < length; i++) {
        id += Math.floor(Math.random() * 10);
    }
    console.log(`📦 createMesID: ${id}`);
    return id;
};

export const getRandomBinary = () => {
    return Math.round(Math.random());
};

export const checkValidUID = async (uid) => {
    console.log(`📦 checkValidUID: ${uid} -> true (всегда валидно)`);
    return true; // Всегда возвращаем true в режиме заглушки
};

// 5. Заглушки для чатов и сообщений
export const getChatData = async ({ account, target, create, message, isMedia }) => {
    console.log(`📦 getChatData: target.type=${target?.type}, target.id=${target?.id}`);
    
    if (target?.type === 0) {
        // Директ-сообщение
        return {
            id: Math.floor(Math.random() * 1000) + 1,
            type: 0
        };
    }
    
    if (target?.type === 1) {
        // Групповой чат
        return {
            id: target.id || Math.floor(Math.random() * 1000) + 1,
            type: 1
        };
    }
    
    return { id: 1, type: 0 };
};

export const pushMessage = async ({ account, target, message, isMedia }) => {
    console.log('📦 pushMessage заглушка:', {
        accountId: account?.ID,
        target: target,
        messageLength: message?.text?.length || 0,
        isMedia
    });
    
    const mesID = await createMesID(6);
    
    return {
        mid: mesID,
        chat_id: Math.floor(Math.random() * 1000) + 1,
        status: 'mock-success',
        message: 'Сообщение отправлено в режиме заглушки'
    };
};

// 6. Заглушка для ошибок
export const createError = (message) => {
    console.log(`📦 createError: ${message}`);
    return { status: 'error', message: message };
};

// 7. Экспорт для нотификаций
export { send } from '../../notify_service/send.js';

// Экспорт по умолчанию
export default {
    getDate,
    getEndDate,
    getSession,
    sendMessageToUser,
    createMesID,
    getRandomBinary,
    checkValidUID,
    getChatData,
    pushMessage,
    createError
};
