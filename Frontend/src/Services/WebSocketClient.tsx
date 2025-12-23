import { EventEmitter } from 'events';
import BaseConfig from '../Configs/Base';
import { errorReporter } from '../System/Services/ErrorReporter.js';

class WebSocketClient extends EventEmitter {
    urls: any;
    urlIndex: number;
    socket: WebSocket | null;
    isConnected: boolean;

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

        this.socketReady = false;

        this.eventListeners = {};
        this.eventQueue = {};
        this.messageQueue = [];
        this.processingMessages = false;
        this.mesCount = 0;
        this.reconnectTimeout = null;
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
            
            // РЕЖИМ БЕЗ ШИФРОВАНИЯ
            console.log('⚠️  Использую режим без шифрования (бэкенд в TEST MODE)');
            this.socketReady = true;
            this.isConnected = true;
            this.emit('socket_ready');
            console.log('✅ Сокет готов (без шифрования)');
            errorReporter.setWebSocketClient(this);
            this.processQueue();
        };

        this.socket.onmessage = async (event: MessageEvent) => {
            console.log('📨 Получено сообщение от сервера');
            
            try {
                const data = JSON.parse(event.data);
                console.log(`📨 Сообщение от сервера: ${data.type || 'unknown'}`);
                
                // Обработка connection_ready от сервера
                if (data.type === 'connection_ready') {
                    console.log('✅ Сервер подтвердил подключение:', data.message);
                }
                
                const listeners = this.eventListeners[data.type];
                if (Array.isArray(listeners)) {
                    listeners.forEach(callback => {
                        callback(data);
                    });
                }
            } catch (error) {
                console.error('❌ Ошибка парсинга сообщения:', error, event.data);
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
        this.socket.onerror = (error) => {
            console.error('❌ WebSocket ошибка:', error);
            handleDisconnect();
        };
    }

    async send(data): Promise<any> {
        if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN || !this.socketReady) {
            console.log('⏳ Отправка сообщения отложена (сокет не готов)', data.type || data);
            this.messageQueue.push(data);
            return;
        }

        const ray_id = this.generateRayID();
        console.log(`📤 Отправка: ${data.type || 'unknown'} (ray_id: ${ray_id})`);

        // Отправляем как JSON (без шифрования)
        this.socket.send(JSON.stringify({ ray_id, ...data }));

        return new Promise((resolve, reject) => {
            const onMessage = async (event: MessageEvent) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.ray_id === ray_id) {
                        this.socket?.removeEventListener('message', onMessage);
                        console.log(`📨 Получен ответ для: ${data.type || 'unknown'} (ray_id: ${ray_id})`);
                        resolve(response);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            this.socket?.addEventListener('message', onMessage);

            setTimeout(() => {
                this.socket?.removeEventListener('message', onMessage);
                console.log(`⏱️  Таймаут ожидания ответа для: ${data.type || 'unknown'} (ray_id: ${ray_id})`);
                // Не реджектим, чтобы не ломать существующий код
                resolve({ status: 'timeout', ray_id });
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

// Подключаемся к бэкенду на Render
export const websocketClient = new WebSocketClient([
    'wss://bayrex-backend.onrender.com/user_api'
    // Только wss (без ws, так как сайт на HTTPS)
]);
