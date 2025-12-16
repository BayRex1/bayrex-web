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
    for (const clientData of rateLimitMap.values()) {
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

const debugLog = (data: any) => {
    try {
        switch (data.type) {
            case 'upload_file':
                return;
            default:
                console.log(data);
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
    }, 30000);

    if (!encrypted) {
        const data: any = decode(message);

        debugLog(data);

        if (typeof data !== 'object' || data === null || !data.type || !data.action) return;

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
        })

        ws.send(response);
        return;
    }

    try {
        const { rsaPublic, aes } = ws.keys.user;

        if (!rsaPublic) {
            try {
                const jsonData = JSON.parse(message);
                if (jsonData.type === 'key_exchange') {
                    ws.keys.user.rsaPublic = jsonData.key;
                    return ws.send(JSON.stringify({
                        type: 'key_exchange',
                        key: ws.keys.server.rsaPublic
                    }));
                }
            } catch (e) {
                console.error('Ошибка парсинга JSON для обмена ключами:', e);
            }
            return;
        }

        if (aes) {
            if (!(message instanceof Uint8Array) && !Buffer.isBuffer(message)) {
                console.error('AES сообщение должно быть в бинарном формате');
                return;
            }

            const decrypted = aesDecrypt(message, ws.keys.server.aes);
            if (!decrypted) return;

            const data: any = decode(decrypted);
            debugLog(data);

            if (typeof data !== 'object' || data === null || !data.type || !data.action) return;

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
                key: aes
            });

            ws.send(response);
            return;
        }

        if (!(message instanceof Uint8Array) && !Buffer.isBuffer(message)) {
            console.error('RSA сообщение должно быть в бинарном формате, получено:', typeof message);
            return;
        }

        const messageUint8 = message instanceof Uint8Array ? message : new Uint8Array(message);

        if (messageUint8.length < 32 || messageUint8.length > 2048) {
            console.error('Некорректная длина RSA сообщения:', messageUint8.length);
            return;
        }

        const decrypted = await rsaDecrypt(messageUint8, ws.keys.server.rsaPrivate);
        if (!decrypted) return;

        const data: any = decode(decrypted);
        debugLog(data);

        if (typeof data === 'object' && data?.type === 'aes_key' && data.key) {
            ws.keys.user.aes = data.key;

            const response = await sendRSA({
                data: { type: 'aes_key', key: ws.keys.server.aes },
                key: ws.keys.user.rsaPublic
            });

            ws.send(response);
        }
    } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);

        try {
            await telegramBot.sendBackendError(error as Error, 'WebSocket handleMessage - RSA processing');
        } catch (telegramError) {
        }

        ws.close();
    } finally {
        clearTimeout(messageTimeout);
    }
};

export default async (ws: any, req: any, encrypted: boolean = true) => {
    console.log('Подключен новый пользователь:', req.socket.remoteAddress);
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
    } catch (error) {
        console.error('Ошибка при генерации ключей:', error);

        try {
            await telegramBot.sendCriticalError(
                'Ошибка генерации RSA ключей',
                `Не удалось сгенерировать ключи для WebSocket соединения: ${error.message}`
            );
        } catch (telegramError) {
        }

        ws.close();
        return;
    }

    ws.on('message', async (message: any) => {
        try {
            const now = Date.now();
            const client = rateLimitMap.get(ws) || { count: 0, lastMessage: 0, warnings: 0 };

            if (now - client.lastMessage < BURST_WINDOW && client.count >= BURST_LIMIT) {
                client.warnings++;
                console.warn(`Burst limit exceeded for ${ws._socket.remoteAddress}, warnings: ${client.warnings}`);

                if (client.warnings >= 3) {
                    console.warn('Too many warnings, closing socket:', ws._socket.remoteAddress);
                    ws.close(1011, 'Burst limit exceeded repeatedly');
                    return;
                }
                return;
            }

            client.count++;
            client.lastMessage = now;

            if (client.count > MAX_MSG_PER_SECOND) {
                console.warn('Rate limit exceeded, closing socket:', ws._socket.remoteAddress);
                ws.close(1011, 'Rate limit exceeded');
                return;
            }

            rateLimitMap.set(ws, client);
            await handleMessage(ws, message, encrypted);
        } catch (error) {
            console.error('Критическая ошибка в обработчике сообщений:', error);
            try {
                ws.close(1011, 'Internal server error');
            } catch (closeError) {
                console.error('Ошибка при закрытии соединения:', closeError);
            }
        }
    });

    ws.on('close', () => {
        rateLimitMap.delete(ws);

        if (ws && ws.account) {
            console.log('Удаление сессии');
            deleteSession(ws.account.ID);
        }
    });
};