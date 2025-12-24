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
                
                // УЛУЧШЕННОЕ ЛОГИРОВАНИЕ: Определяем тип сообщения
                const messageType = data.action || data.type || 'unknown';
                console.log(`📨 Сообщение от сервера: ${messageType}`);
                
                // СПЕЦИАЛЬНАЯ ОБРАБОТКА ДЛЯ ПРОФИЛЯ
                if (messageType === 'get_profile') {
                    console.log('👤 Обработка ответа профиля');
                    console.log('📊 Структура данных:', {
                        status: data.status,
                        hasData: !!data.data,
                        dataKeys: data.data ? Object.keys(data.data) : 'no data'
                    });
                }
                
                // Обработка connection_ready от сервера
                if (data.type === 'connection_ready') {
                    console.log('✅ Сервер подтвердил подключение:', data.message);
                }
                
                // ВЫЗЫВАЕМ ОБРАБОТЧИКИ ДЛЯ action (основной способ)
                if (data.action) {
                    const listeners = this.eventListeners[data.action];
                    if (Array.isArray(listeners)) {
                        console.log(`🔊 Вызываем ${listeners.length} обработчиков для action: ${data.action}`);
                        listeners.forEach(callback => {
                            try {
                                callback(data);
                            } catch (error) {
                                console.error(`❌ Ошибка в обработчике ${data.action}:`, error);
                            }
                        });
                    }
                }
                
                // ВЫЗЫВАЕМ ОБРАБОТЧИКИ ДЛЯ type (для обратной совместимости)
                if (data.type && data.type !== data.action) { // Не дублируем вызовы
                    const listeners = this.eventListeners[data.type];
                    if (Array.isArray(listeners)) {
                        console.log(`🔊 Вызываем ${listeners.length} обработчиков для type: ${data.type}`);
                        listeners.forEach(callback => {
                            try {
                                callback(data);
                            } catch (error) {
                                console.error(`❌ Ошибка в обработчике ${data.type}:`, error);
                            }
                        });
                    }
                }
                
                // Эмитируем общее событие
                this.emit('message', data);
                
            } catch (error) {
                console.error('❌ Ошибка парсинга сообщения:', error, event.data);
                
                // Отправляем ошибку на сервер для диагностики
                this.send({
                    type: 'system',
                    action: 'report_error',
                    data: {
                        error: 'parse_error',
                        message: error.message,
                        raw_data: event.data.substring(0, 200)
                    }
                });
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
            console.log('⏳ Отправка сообщения отложена (сокет не готов)', data.action || data.type || 'unknown');
            this.messageQueue.push(data);
            return;
        }

        const ray_id = this.generateRayID();
        console.log(`📤 Отправка: ${data.action || data.type || 'unknown'} (ray_id: ${ray_id})`);

        // Отправляем как JSON (без шифрования)
        this.socket.send(JSON.stringify({ ray_id, ...data }));

        return new Promise((resolve, reject) => {
            const onMessage = async (event: MessageEvent) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.ray_id === ray_id) {
                        this.socket?.removeEventListener('message', onMessage);
                        console.log(`📨 Получен ответ для: ${data.action || data.type || 'unknown'} (ray_id: ${ray_id})`);
                        resolve(response);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            this.socket?.addEventListener('message', onMessage);

            setTimeout(() => {
                this.socket?.removeEventListener('message', onMessage);
                console.log(`⏱️  Таймаут ожидания ответа для: ${data.action || data.type || 'unknown'} (ray_id: ${ray_id})`);
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
        console.log(`🎯 Регистрация обработчика для: ${type}`);
        
        if (!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }

        if (!this.eventListeners[type].includes(callback)) {
            this.eventListeners[type].push(callback);

            // Обрабатываем накопленные события
            if (this.eventQueue[type]) {
                console.log(`📂 Обработка ${this.eventQueue[type].length} накопленных событий для: ${type}`);
                while (this.eventQueue[type].length > 0) {
                    try {
                        callback(this.eventQueue[type].shift());
                    } catch (error) {
                        console.error(`❌ Ошибка в обработчике накопленного события ${type}:`, error);
                    }
                }
            }
        }
    }

    offMessage(type: string, callback: (data: any) => void): void {
        if (this.eventListeners[type]) {
            this.eventListeners[type] = this.eventListeners[type].filter(cb => cb !== callback);
            console.log(`🗑️  Удалён обработчик для: ${type}`);
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

// 🔧 ДОБАВЛЯЕМ СПЕЦИАЛЬНЫЙ ОБРАБОТЧИК ДЛЯ ПРОФИЛЯ
// Это гарантирует, что данные профиля будут правильно обработаны
websocketClient.onMessage('get_profile', (data) => {
    console.log('👤 [ГЛОБАЛЬНЫЙ ОБРАБОТЧИК] Получены данные профиля');
    
    // НОРМАЛИЗУЕМ ДАННЫЕ: гарантируем наличие поля path
    if (data.status === 'success' && data.data) {
        const profileData = data.data;
        
        // Если у профиля нет path, добавляем его
        if (!profileData.path && profileData.username) {
            profileData.path = `/profile/${profileData.username}`;
            console.log('👤 Добавлено поле path к профилю:', profileData.path);
        }
        
        // Если у профиля нет tabs, добавляем базовые вкладки
        if (!profileData.tabs && profileData.username) {
            profileData.tabs = [
                { id: 'posts', label: 'Посты', path: `/profile/${profileData.username}/posts` },
                { id: 'about', label: 'О себе', path: `/profile/${profileData.username}/about` },
                { id: 'subscribers', label: 'Подписчики', path: `/profile/${profileData.username}/subscribers` },
                { id: 'subscriptions', label: 'Подписки', path: `/profile/${profileData.username}/subscriptions` },
            ];
            console.log('👤 Добавлены базовые вкладки профиля');
        }
        
        // Эмитируем нормализованное событие
        websocketClient.emit('profile_loaded', profileData);
    } else {
        console.error('👤 [ГЛОБАЛЬНЫЙ ОБРАБОТЧИК] Ошибка в данных профиля:', data);
        websocketClient.emit('profile_error', {
            message: data.message || 'Ошибка загрузки профиля',
            originalData: data
        });
    }
});

// 🎯 ДОБАВЛЯЕМ ОБРАБОТКУ ОШИБОК
websocketClient.onMessage('error', (data) => {
    console.error('❌ [ГЛОБАЛЬНЫЙ ОБРАБОТЧИК] Ошибка от сервера:', data);
    websocketClient.emit('server_error', data);
});
