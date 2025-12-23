// notify_service/send.ts - Полная заглушка для режима без БД
import Config from '../system/global/Config.js';

console.log('📦 Notify service: РЕЖИМ ЗАГЛУШКИ (без WebPush, без БД)');

// Заглушка для web-push (если он не установлен)
let webPush: any = {
    setVapidDetails: () => console.log('📦 WebPush заглушка: VAPID детали установлены'),
    sendNotification: async () => {
        console.log('📦 WebPush заглушка: уведомление "отправлено"');
        return { status: 'mock-success' };
    }
};

try {
    // Пробуем импортировать реальный web-push
    const webPushModule = await import('web-push');
    webPush = webPushModule.default || webPushModule;
    console.log('✅ WebPush загружен');
} catch (error) {
    console.log('⚠️  WebPush недоступен, используем заглушку');
}

// Заглушка для getSession
export const getSession = async (sessionId: string | number) => {
    console.log(`📦 getSession заглушка для: ${sessionId}`);
    
    // Возвращаем фиктивную сессию
    return {
        uid: typeof sessionId === 'number' ? sessionId : 1,
        s_key: typeof sessionId === 'string' ? sessionId : 'mock_session_key',
        connection: null,
        aesKey: 'mock_aes_key_for_testing'
    };
};

// Заглушка для sendMessageToUser
export const sendMessageToUser = async (params: { uid: number; message: any } | number, message?: any) => {
    let userId: number;
    let actualMessage: any;
    
    if (typeof params === 'object' && params.uid) {
        userId = params.uid;
        actualMessage = params.message;
    } else {
        userId = params as number;
        actualMessage = message;
    }
    
    console.log(`📦 sendMessageToUser заглушка: user=${userId}, type=${actualMessage?.type || 'unknown'}`);
    
    // В реальном режиме здесь была бы отправка через WebSocket
    // Для заглушки просто логируем
    return { success: true, message: 'Сообщение отправлено (режим заглушки)' };
};

// Заглушка для sendAES
const sendAES = async ({ data, key }: { data: any; key: string }) => {
    console.log(`📦 sendAES заглушка: шифрование данных типа ${data?.type || 'unknown'}`);
    return data; // Возвращаем данные как есть
};

// Главная функция send - полная заглушка
export async function send(uid: number, payload: any) {
    try {
        console.log('📦 Notify.send заглушка вызвана:', {
            uid,
            from: payload?.from,
            action: payload?.action
        });

        if (!uid || !payload?.from || !payload?.action) {
            console.log('⚠️  Пропускаем уведомление: недостаточно данных');
            return;
        }

        // Логируем "отправку" уведомления
        console.log(`📨 Заглушка: Уведомление для пользователя ${uid} от ${payload.from} (${payload.action})`);
        
        // Пытаемся отправить через WebSocket (заглушка)
        try {
            const session = await getSession(uid);
            
            if (session) {
                await sendMessageToUser({
                    uid: uid,
                    message: await sendAES({
                        data: {
                            type: 'social',
                            action: 'notify',
                            notification: {
                                id: Date.now(),
                                author: { id: payload.from, name: 'System' },
                                action: payload.action,
                                content: payload.content || {},
                                viewed: 0,
                                date: new Date().toISOString()
                            }
                        },
                        key: session.aesKey || 'mock_key'
                    })
                });
                console.log('✅ Заглушка: WebSocket уведомление "отправлено"');
            }
        } catch (wsError) {
            console.log('⚠️  Заглушка: Ошибка WebSocket отправки (игнорируем)', wsError.message);
        }

        return { status: 'mock-success', message: 'Уведомление обработано в режиме заглушки' };
        
    } catch (error) {
        console.error('❌ Ошибка в notify заглушке:', error.message);
        return { status: 'mock-error', error: error.message };
    }
}

// Экспорт по умолчанию
export default {
    send,
    getSession,
    sendMessageToUser
};
