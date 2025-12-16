import crypto from 'crypto';
import router from './router.js';
import { rsaDecrypt, aesCreateKey, aesDecrypt, sendRSA, sendAES } from '../system/global/Crypto.js';
import { deleteSession } from '../system/global/AccountManager.js';
import { decode } from '@msgpack/msgpack';

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

const handleMessage = async (ws: any, message: any) => {
    try {
        if (ws.keys.user.rsaPublic) {
            if (ws.keys.user.aes) {
                const decrypted = aesDecrypt(message, ws.keys.server.aes);

                if (decrypted) {
                    const data: any = decode(decrypted);
                    debugLog(data);
    
                    if (typeof data === 'object' && data !== null) {
                        if (data.type && data.action) {
                            const answer = await router({
                                ws: ws,
                                type: data.type,
                                action: data.action,
                                data: data
                            })
                            if (answer) {
                                ws.send(await sendAES({
                                    data: { ray_id: data.ray_id ? data.ray_id : null, ...answer },
                                    key: ws.keys.user.aes
                                }));
                            }
                        }
                    }
                }
            } else {
                const decrypted = await rsaDecrypt(message, ws.keys.server.rsaPrivate);

                if (decrypted) {
                    const data: any = decode(decrypted);

                    if (typeof data === 'object' && data !== null) {
                        if (data.type === 'aes_key') {
                            ws.keys.user.aes = data.key;
                            ws.send(await sendRSA({
                                data: { type: 'aes_key', key: ws.keys.server.aes },
                                key: ws.keys.user.rsaPublic
                            }));
                        }
                    }
                }
            }
        } else {
            const jsonData = JSON.parse(message);

            if (jsonData.type === 'key_exchange') {
                ws.keys.user.rsaPublic = jsonData.key;
                ws.send(JSON.stringify({
                    type: 'key_exchange',
                    key: ws.keys.server.rsaPublic
                }));
            }
        }
    } catch (error) {
        console.error('Ошибка при обработке сообщения:', error);
        ws.close();
    }
}

export default (ws: any, req: any) => {
    console.log('Подключено новое приложение:', req.socket.remoteAddress);
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
        ws.close();
        return;
    }

    ws.on('message', async (message: any) => {
        await handleMessage(ws, message);
    });

    ws.on('close', () => {
        if (ws && ws.app) {
            console.log('Удаление сессии');
            deleteSession(ws.app.id);
        }
    });
};
