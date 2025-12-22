import { EventEmitter } from 'events';
import { rsaEncrypt, rsaDecrypt, aesEncrypt, aesDecrypt, arrayBufferToPem, blobToUint8Array, generateAESKey } from '../System/Modules/Crypto';
import BaseConfig from '../Configs/Base';
import { decode, encode } from '@msgpack/msgpack';
import { errorReporter } from '../System/Services/ErrorReporter.js';

class WebSocketClient extends EventEmitter {
    urls: any;
    urlIndex: number;
    socket: WebSocket | null;
    isConnected: boolean;

    rsaPublic: ArrayBuffer | null;
    rsaPrivate: ArrayBuffer | null;
    rsaPublicServer: string | null;
    aesKey: string | null;
    aesServerKey: string | null;
    keysReady: boolean;
    socketReady: boolean;

    eventListeners: { [key: string]: Array<(data: any) => void> };
    eventQueue: { [key: string]: any[] };
    messageQueue: any[];
    processingMessages: boolean;
    mesCount: number;
    reconnectTimeout: number | null;

    constructor(urls: any) {
        super();

        this.urls = urls;
        this.urlIndex = 0;
        this.socket = null;
        this.isConnected = false;

        this.rsaPublic = null;
        this.rsaPrivate = null;
        this.rsaPublicServer = null;
        this.aesKey = null;
        this.aesServerKey = null;
        this.keysReady = false;
        this.socketReady = false;

        this.eventListeners = {};
        this.eventQueue = {};
        this.messageQueue = [];
        this.processingMessages = false;
        this.mesCount = 0;
        this.reconnectTimeout = null;
    }

    async generateKeys(): Promise<boolean> {
        const keyPair = await window.crypto.subtle.generateKey({
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: { name: 'SHA-256' }
        }, true, ['encrypt', 'decrypt']);
        this.rsaPublic = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
        this.rsaPrivate = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
        this.keysReady = true;
        return true;
    }

    connect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        console.log('🔄 Пытаюсь соединиться с WebSocket сервером...');
        const url = this.getCurrentURL();
        console.log(`📡 URL подключения: ${url}`);
        this.socket = new WebSocket(url);

        this.socket.onopen = async () => {
            console.log('✅ Соединение установлено');
            this.emit('socket_connect');
            await this.generateKeys();
            const publicKeyPem = arrayBufferToPem(this.rsaPublic as ArrayBuffer, 'PUBLIC KEY');

            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'key_exchange',
                    key: publicKeyPem
                }));
                this.isConnected = true;
                this.processQueue();
            }
        };

        this.socket.onmessage = async (event: MessageEvent) => {
            const rawData = event.data;

            if (this.rsaPublicServer) {
                if (this.aesServerKey) {
                    const unit8Array = await blobToUint8Array(rawData);
                    const decryptedAes = await aesDecrypt(unit8Array.buffer, this.aesKey as string);
                    const decryptedData: any = decode(decryptedAes);
                    const listeners = this.eventListeners[decryptedData.type];
                    if (Array.isArray(listeners)) {
                        if (decryptedData.type === 'messenger' && decryptedData.action === 'download_file') {
                            this.mesCount++;
                            console.log(`📥 count: ${this.mesCount}`);
                        }
                        listeners.forEach(callback => {
                            callback(decryptedData);
                        });
                    }
                } else {
                    try {
                        if (!this.rsaPrivate) {
                            console.error('RSA private key не готов');
                            return;
                        }
                        const unit8Array = await blobToUint8Array(rawData);
                        const decryptedRsa = await rsaDecrypt(unit8Array.buffer, this.rsaPrivate as ArrayBuffer);
                        const decryptedData: any = decode(decryptedRsa);
                        if (decryptedData.type && decryptedData.type === 'aes_key') {
                            this.aesServerKey = decryptedData.key;
                            this.socketReady = true;
                            this.emit('socket_ready');
                            console.log('✅ Сокет полностью готов');
                            errorReporter.setWebSocketClient(this);
                            this.processQueue();
                        }
                    } catch (error) {
                        console.error('❌ Ошибка обработки RSA сообщения:', error);
                        this.disconnect();
                    }
                }
            } else {
                const data: any = JSON.parse(rawData);
                if (data.type === 'key_exchange') {
                    this.rsaPublicServer = data.key;
                    this.aesKey = generateAESKey();
                    const aesKeyPayload = encode({
                        type: 'aes_key',
                        key: this.aesKey
                    });
                    const encryptedPayload = await rsaEncrypt(aesKeyPayload, this.rsaPublicServer as string);
                    this.socket?.send(encryptedPayload);
                }
            }
        };

        const handleDisconnect = (): void => {
            console.log('🔌 Соединение разорвано');
            this.disconnect();
            if (!this.reconnectTimeout) {
                this.nextURL();
                console.log(`🔄 Переключаюсь на следующий URL через 5 секунд...`);
                this.reconnectTimeout = window.setTimeout(() => {
                    console.log('🔄 Попытка переподключения...');
                    this.connect();
                    this.reconnectTimeout = null;
                }, 5000);
            }
        };

        this.socket.onclose = handleDisconnect;
        this.socket.onerror = handleDisconnect;
    }

    async send(data): Promise<any> {
        if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN || !this.socketReady) {
            console.log('⏳ Отправка сообщения отложена (сокет не готов)', data);
            this.messageQueue.push(data);
            return;
        }

        const ray_id = this.generateRayID();

        const binaryData = encode({ ray_id, ...data });
        const encrypted = await aesEncrypt(binaryData, this.aesServerKey as string);
        this.socket.send(encrypted as any);

        return new Promise((resolve, reject) => {
            const onMessage = async (event: MessageEvent) => {
                try {
                    const unit8Array = await blobToUint8Array(event.data);
                    const decryptedAes = await aesDecrypt(unit8Array.buffer, this.aesKey as string);
                    const decryptedData: any = decode(decryptedAes);

                    if (decryptedData.ray_id === ray_id) {
                        this.socket?.removeEventListener('message', onMessage);
                        resolve(decryptedData);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            this.socket?.addEventListener('message', onMessage);

            setTimeout(() => {
                this.socket?.removeEventListener('message', onMessage);
                // reject(new Error(`Превышено время ожидания для ray_id: ${ray_id}`));
            }, 5000);
        });
    }

    getCurrentURL(): string {
        return this.urls[this.urlIndex];
    }

    nextURL(): void {
        this.urlIndex = (this.urlIndex + 1) % this.urls.length;
        console.log(`🔄 Следующий URL: ${this.urls[this.urlIndex]}`);
    }

    generateRayID(): string {
        const timestamp = Date.now();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomPart = '';
        for (let i = 0; i < 10; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `${timestamp}${randomPart}`;
    }

    processQueue(): void {
        if (!this.socketReady || this.processingMessages) return;
        this.processingMessages = true;

        console.log(`📤 Обработка очереди сообщений: ${this.messageQueue.length} сообщений`);
        
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
        }

        this.processingMessages = false;
    }

    disconnect(): void {
        console.log('🔌 Отключение WebSocket...');
        
        if (this.socket) {
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.close();
            }
            this.socket = null;
        }

        this.isConnected = false;

        this.rsaPublic = null;
        this.rsaPrivate = null;
        this.rsaPublicServer = null;
        this.aesKey = null;
        this.aesServerKey = null;

        this.keysReady = false;
        this.socketReady = false;
        this.emit('socket_disconnect');
        this.emit('socket_not_ready');
    }

    onMessage(type: string, callback: (data: any) => void): void {
        if (!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }

        if (!this.eventListeners[type].includes(callback)) {
            this.eventListeners[type].push(callback);

            if (this.eventQueue[type]) {
                while (this.eventQueue[type].length > 0) {
                    callback(this.eventQueue[type].shift());
                }
            }
        }
    }

    offMessage(type: string, callback: (data: any) => void): void {
        if (this.eventListeners[type]) {
            this.eventListeners[type] = this.eventListeners[type].filter(cb => cb !== callback);
        }
    }

    getConnectionStatus() {
        return {
            currentIndex: this.urlIndex,
            urls: this.urls,
            isConnected: this.isConnected,
            socketReady: this.socketReady,
            currentURL: this.getCurrentURL()
        };
    }
}

// ИСПРАВЛЕННЫЙ URL: подключаемся к правильному бэкенду на Render
export const websocketClient = new WebSocketClient([
    'wss://bayrex-backend.onrender.com/user_api',
    'ws://bayrex-backend.onrender.com/user_api'
    // Для локальной разработки можно раскомментировать:
    // 'ws://localhost:10000/user_api'
]);
