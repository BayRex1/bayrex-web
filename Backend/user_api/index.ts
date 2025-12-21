import * as crypto from 'crypto';
import router from './router.js';
import { aesCreateKey, aesDecrypt, rsaDecrypt, sendAES, sendRSA } from '../system/global/Crypto.js';
import { decode, encode } from '@msgpack/msgpack';
import { telegramBot } from '../services/system/TelegramBot.js';
import { deleteSession } from '../system/global/AccountManager.js';

const rateLimitMap = new Map<any, { count: number; lastMessage: number; warnings: number }>();
const MAX_MSG_PER_SECOND = 50;
const BURST_LIMIT = 50;
const BURST_WINDOW = 1000;

const rateLimitInterval = setInterval(() => {
    for (const [ws, clientData] of rateLimitMap.entries()) {
        // Удаляем неактивные соединения
        if (!ws || ws.readyState !== 1) { // 1 = OPEN
            rateLimitMap.delete(ws);
            continue;
        }
        clientData.count = 0;
        if (clientData.warnings > 0) {
            clientData.warnings = Math.max(0, clientData.warnings - 1);
        }
    }
}, 1000);

process.on('SIGTERM', () => {
    clearInterval(rateLimitInterval);
});

process.on('SIGINT', () => {
    clearInterval(rateLimitInterval);
});

// Функция для преобразования сообщения в Uint8Array
const toUint8Array = (message) => {
    if (message instanceof Uint8Array) return message;
    if (Buffer.isBuffer(message)) return new Uint8Array(message);
    if (typeof message === 'string') return new TextEncoder().encode(message);
    if (message instanceof ArrayBuffer) return new Uint8Array(message);
    if (Array.isArray(message)) return new Uint8Array(message);
    
    console.error('Неподдерживаемый формат сообщения:', typeof message, message);
    return null;
};

const debugLog = (data: any) => {
    try {
        switch (data.type) {
            case 'upload_file':
                return;
            default:
                console.log('📨 WebSocket сообщение:', data.type, data.action);
                break;
        }
    } catch (e) {
        console.log('Ошибка при отладке: ', e);
    }
}

const handleMessage = async (ws: any, message: any, encrypted) => {
    const messageTimeout = setTimeout(() => {
        console.warn('Timeout обработки сообщения, закрываем соединение');
        try {
            ws.close(1011, 'Message processing timeout');
        } catch (e) { }
    }, 10000); // Уменьшил до 10 секунд

    try {
        if (!encrypted) {
            const data: any = decode(message);

            debugLog(data);

            if (typeof data !== 'object' || data === null || !data.type || !data.action) {
                console.warn('Некорректный формат данных (незашифрованный):', data);
                return;
            }

            const answer = await router({
                ws,
                type: data.type,
                action: data.action,
                data
            });

            if (!answer) return;

            const response = encode({
                ray_id: data.ray_id || null,
                ...answer
            });

            ws.send(response);
            return;
        }

        // === ИСПРАВЛЕНИЕ 1: Добавлена обработка начального key_exchange ===
        if (!ws.keys.user.rsaPublic) {
            try {
                // Пытаемся прочитать как JSON (клиент отправляет ключ в JSON)
                const messageStr = typeof message === 'string' 
                    ? message 
                    : new TextDecoder().decode(toUint8Array(message));
                
                const jsonData = JSON.parse(messageStr);
                
                if (jsonData.type === 'key_exchange' && jsonData.key) {
                    console.log('🔑 Получен публичный ключ от клиента');
                    ws.keys.user.rsaPublic = jsonData.key;
                    
                    // ОТПРАВЛЯЕМ ОТВЕТ КЛИЕНТУ (это критически важно!)
                    const response = JSON.stringify({
                        type: 'key_exchange',
                        key: ws.keys.server.rsaPublic
                    });
                    
                    ws.send(response);
                    console.log('✅ Отправлен серверный публичный ключ');
                    return;
                }
            } catch (e) {
                console.error('Ошибка обработки key_exchange:', e);
                // Не закрываем соединение, продолжаем
            }
        }

        // === ИСПРАВЛЕНИЕ 2: Гибкая обработка форматов данных ===
        const messageData = toUint8Array(message);
        if (!messageData) {
            console.error('Не удалось преобразовать сообщение в Uint8Array');
            return;
        }

        if (ws.keys.user.aes) {
            // AES шифрование
            const decrypted = aesDecrypt(messageData, ws.keys.server.aes);
            if (!decrypted) {
                console.error('Ошибка AES дешифрования');
                return;
            }

            const data: any = decode(decrypted);
            debugLog(data);

            if (typeof data !== 'object' || data === null || !data.type || !data.action) {
                console.warn('Некорректный формат данных (AES):', data);
                return;
            }

            const answer = await router({
                ws,
                type: data.type,
                action: data.action,
                data
            });

            if (!answer) return;

            const response = await sendAES({
                data: {
                    ray_id: data.ray_id || null,
                    ...answer
                },
                key: ws.keys.user.aes
            });

            ws.send(response);
            return;
        }

        // RSA шифрование (для передачи AES ключа)
        if (messageData.length < 32 || messageData.length > 512) {
            console.error('Некорректная длина RSA сообщения:', messageData.length);
            return;
        }

        const decrypted = await rsaDecrypt(messageData, ws.keys.server.rsaPrivate);
        if (!decrypted) {
            console.error('Ошибка RSA дешифрования');
            return;
        }

        const data: any = decode(decrypted);
        debugLog(data);

        if (typeof data === 'object' && data?.type === 'aes_key' && data.key) {
            console.log('🔑 Получен AES ключ от клиента');
            ws.keys.user.aes = data.key;

            const response = await sendRSA({
                data: { type: 'aes_key', key: ws.keys.server.aes },
                key: ws.keys.user.rsaPublic
            });

            ws.send(response);
            console.log('✅ Отправлен серверный AES ключ, соединение установлено');
            
            // Отправляем подтверждение установки соединения
            const readyMsg = await sendAES({
                data: { 
                    type: 'connection_ready',
                    message: 'WebSocket connection established',
                    timestamp: Date.now()
                },
                key: ws.keys.user.aes
            });
            ws.send(readyMsg);
        }
    } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);

        try {
            await telegramBot.sendBackendError(error, 'WebSocket handleMessage');
        } catch (telegramError) {
            console.error('Ошибка отправки в Telegram:', telegramError);
        }

        try {
            ws.close(1011, 'Internal server error');
        } catch (closeError) {
            console.error('Ошибка при закрытии соединения:', closeError);
        }
    } finally {
        clearTimeout(messageTimeout);
    }
};

export default async (ws: any, req: any, encrypted: boolean = true) => {
    console.log('✅ Подключен новый пользователь:', req.socket.remoteAddress);
    
    ws.session = {};
    const aesKey = aesCreateKey();

    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        
        ws.keys = {
            server: {
                aes: aesKey,
                rsaPublic: publicKey,
                rsaPrivate: privateKey
            },
            user: {
                aes: null,
                rsaPublic: null
            }
        };
        
        console.log('🔑 Ключи сгенерированы для нового соединения');
        
        // === ИСПРАВЛЕНИЕ 3: Добавляем обработчики ошибок и закрытия ===
        ws.on('error', (error) => {
            console.error('WebSocket error:', error, 'from', req.socket.remoteAddress);
        });
        
        // Keep-alive для поддержания соединения
        const keepAliveInterval = setInterval(() => {
            if (ws.readyState === 1) { // 1 = OPEN
                try {
                    if (ws.keys.user.aes) {
                        // Можно отправлять ping, если нужно
                    }
                } catch (e) {
                    console.error('Ошибка keep-alive:', e);
                }
            } else {
                clearInterval(keepAliveInterval);
            }
        }, 30000);
        
        ws.on('close', () => {
            clearInterval(keepAliveInterval);
            rateLimitMap.delete(ws);

            if (ws && ws.account) {
                console.log('🗑️ Удаление сессии для аккаунта:', ws.account.ID);
                deleteSession(ws.account.ID);
            }
            
            console.log('❌ Соединение закрыто:', req.socket.remoteAddress);
        });
        
    } catch (error) {
        console.error('❌ Ошибка при генерации ключей:', error);

        try {
            await telegramBot.sendCriticalError(
                'Ошибка генерации RSA ключей',
                `Не удалось сгенерировать ключи для WebSocket соединения от ${req.socket.remoteAddress}: ${error.message}`
            );
        } catch (telegramError) {
            console.error('Ошибка отправки в Telegram:', telegramError);
        }

        try {
            ws.close(1011, 'Key generation failed');
        } catch (closeError) {
            console.error('Ошибка при закрытии соединения:', closeError);
        }
        return;
    }
};
