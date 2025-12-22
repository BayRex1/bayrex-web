import * as crypto from 'crypto';
import router from './router.js';
import { telegramBot } from '../services/system/TelegramBot.js';
import { deleteSession } from '../system/global/AccountManager.js';

const rateLimitMap = new Map<any, { count: number; lastMessage: number; warnings: number }>();
const MAX_MSG_PER_SECOND = 50;

const rateLimitInterval = setInterval(() => {
    for (const [ws, clientData] of rateLimitMap.entries()) {
        if (!ws || ws.readyState !== 1) {
            rateLimitMap.delete(ws);
            continue;
        }
        clientData.count = 0;
    }
}, 1000);

process.on('SIGTERM', () => clearInterval(rateLimitInterval));
process.on('SIGINT', () => clearInterval(rateLimitInterval));

export default async (ws: any, req: any, encrypted: boolean = false) => {
    console.log('✅ TEST MODE: Подключен новый пользователь (без шифрования):', req.socket.remoteAddress);
    
    // Отправляем приветственное сообщение сразу
    ws.send(JSON.stringify({ 
        type: 'connection_ready',
        message: 'WebSocket подключен (тестовый режим)',
        timestamp: Date.now(),
        test_mode: true
    }));

    ws.on('message', async (message: any) => {
        try {
            const client = rateLimitMap.get(ws) || { count: 0, lastMessage: 0 };
            client.count++;
            
            if (client.count > MAX_MSG_PER_SECOND) {
                ws.close(1011, 'Rate limit exceeded');
                return;
            }
            
            rateLimitMap.set(ws, client);
            
            // Просто логируем что пришло
            let data;
            try {
                data = JSON.parse(message.toString());
                console.log('📨 TEST MODE: Получено:', data.type, data.action || '');
            } catch {
                console.log('📨 TEST MODE: Не JSON:', message.toString().substring(0, 100));
                return;
            }
            
            // Обрабатываем ping
            if (data.type === 'ping') {
                ws.send(JSON.stringify({ 
                    type: 'ping', 
                    status: 'pong',
                    timestamp: Date.now() 
                }));
                return;
            }
            
            // Пробуем роутер
            if (data.type && data.action) {
                try {
                    const answer = await router({
                        ws,
                        type: data.type,
                        action: data.action,
                        data
                    });
                    
                    if (answer) {
                        ws.send(JSON.stringify({
                            ray_id: data.ray_id || null,
                            ...answer
                        }));
                    }
                } catch (error) {
                    console.error('❌ Router error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Router processing error'
                    }));
                }
            }
            
        } catch (error) {
            console.error('❌ Message handler error:', error);
        }
    });

    ws.on('close', () => {
        rateLimitMap.delete(ws);
        console.log('❌ TEST MODE: Соединение закрыто:', req.socket.remoteAddress);
    });
    
    ws.on('error', (error) => {
        console.error('❌ TEST MODE: WebSocket error:', error);
    });
};
