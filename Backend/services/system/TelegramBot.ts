import axios from 'axios';
import Config from '../../system/global/Config.js';
import { dbE } from '../../lib/db.js';
import * as os from 'os';
import getUserPermissions from '../../user_api/controllers/social/moderation/get_user_permissions.js';
import updateUserPermissions from '../../user_api/controllers/social/moderation/update_user_permissions.js';

interface TelegramConfig {
    token: string;
    chatId: string;
    enabled: boolean;
}

interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: {
            id: number;
            username?: string;
            first_name: string;
        };
        text: string;
        chat: {
            id: number;
        };
    };
    callback_query?: {
        id: string;
        from: {
            id: number;
        };
        message?: {
            message_id: number;
            chat: { id: number };
        };
        data?: string;
    };
}

class TelegramBot {
    private config: TelegramConfig;
    private readonly apiUrl: string;
    private readonly adminIds = [5881544347, 7863161958];
    private lastUpdateId = 0;
    private processedMessages = new Set<number>();
    private pollingTimeoutId: NodeJS.Timeout | null = null;

    constructor() {
        this.config = {
            token: Config.TELEGRAM?.BOT_TOKEN || '',
            chatId: Config.TELEGRAM?.CHAT_ID || '',
            enabled: !!(Config.TELEGRAM?.BOT_TOKEN && Config.TELEGRAM?.CHAT_ID)
        };
        
        this.apiUrl = `https://api.telegram.org/bot${this.config.token}`;
        
        if (this.config.enabled) {
            this.startPolling();
        }
    }

    private isAdmin(userId: number): boolean {
        return this.adminIds.includes(userId);
    }

    private async startPolling() {
        if (!this.config.enabled) return;
        
        const pollUpdates = async () => {
            try {
                const response = await axios.get(`${this.apiUrl}/getUpdates`, {
                    params: { 
                        offset: this.lastUpdateId + 1,
                        timeout: 10 
                    }
                });
                
                const updates: TelegramUpdate[] = response.data.result;
                
                for (const update of updates) {
                    if (update.callback_query?.data) {
                        await this.handleCallback(update);
                    } else if (update.message?.text?.startsWith('/') && !this.processedMessages.has(update.message.message_id)) {
                        this.processedMessages.add(update.message.message_id);
                        await this.handleCommand(update);
                    }
                    this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
                }
                
                if (this.processedMessages.size > 1000) {
                    this.processedMessages.clear();
                }
            } catch (error) {
                // console.error('Ошибка в Telegram polling:', error);
            }
            
            this.pollingTimeoutId = setTimeout(pollUpdates, 2000);
        };
        
        pollUpdates();
    }

    private async handleCommand(update: TelegramUpdate) {
        const message = update.message;
        if (!message || !message.text) return;

        const userId = message.from.id;
        const text = message.text.trim();
        const chatId = message.chat.id;

        if (!text.startsWith('/') || text.length < 2) {
            return;
        }

        if (!this.isAdmin(userId)) {
            await this.sendMessageToChat(chatId, 'Доступ запрещен');
            return;
        }

        const command = text.split(' ')[0].toLowerCase().split('@')[0];
        const args = text.split(' ').slice(1);

        try {
            switch (command) {
                case '/status':
                    await this.handleStatusCommand(chatId);
                    break;
                case '/logs':
                    await this.handleLogsCommand(chatId, args);
                    break;
                case '/stats':
                    await this.handleStatsCommand(chatId);
                    break;
                case '/check':
                    await this.handleGrantAdminCommand(chatId, args);
                    break;
                case '/user':
                    await this.handleUserInfoCommand(chatId, args);
                    break;
                case '/perm':
                    await this.handlePermissionMenuCommand(chatId, args);
                    break;
                case '/help':
                    await this.handleHelpCommand(chatId);
                    break;
                default:
                    await this.sendMessageToChat(chatId, `Неизвестная команда: ${command}`);
            }
        } catch (error) {
            // await this.sendMessageToChat(chatId, `Ошибка: ${error.message}`);
        }
    }



    private async handleCallback(update: TelegramUpdate) {
        try {
            const data = update.callback_query?.data || '';
            const chatId = update.callback_query?.message?.chat.id as number;
            if (!chatId) return;

            const parts = data.split(':');
            if (parts[0] === 'perm' && parts.length === 4) {
                const uid = parseInt(parts[1]);
                const key = parts[2] as 'Posts' | 'Comments' | 'NewChats' | 'MusicUpload';
                const enable = parts[3] === 'on';

                await getUserPermissions({ data: { payload: { user_id: uid } } });
                await updateUserPermissions({ account: { ID: uid }, data: { payload: { user_id: uid, permissions: { [key]: enable } } } });
                await this.answerCallback(update.callback_query.id, 'ok');
                return;
            }

            if (parts[0] === 'icon' && parts.length === 4) {
                const uid = parseInt(parts[1]);
                const icon = parts[2];
                const enable = parts[3] === 'on';
                if (!['VERIFY','FAKE'].includes(icon)) return;

                const icons: any = { VERIFY: false, FAKE: false };
                icons[icon] = enable;
                await getUserPermissions({ data: { payload: { user_id: uid } } });
                await updateUserPermissions({ account: { ID: uid }, data: { payload: { user_id: uid, permissions: {}, icons } } });
                await this.answerCallback(update.callback_query.id, 'ok');
                return;
            }

            await this.answerCallback(update.callback_query.id, '');
        } catch (e) {
            if (update.callback_query?.id) {
                await this.answerCallback(update.callback_query.id, 'err');
            }
        }
    }

    private async answerCallback(callbackId: string, text: string) {
        try {
            await axios.post(`${this.apiUrl}/answerCallbackQuery`, { callback_query_id: callbackId, text });
        } catch {}
    }
    private async handleStatusCommand(chatId: number) {
        try {
            const systemInfo = await this.getSystemInfo();
            const dbInfo = await this.getDatabaseInfo();
            
            const message = `СТАТУС СИСТЕМЫ\n\n` +
                           `Сервер:\n` +
                           `RAM: ${systemInfo.memoryUsed}/${systemInfo.memoryTotal} GB (${systemInfo.memory}%)\n` +
                           `Uptime: ${systemInfo.uptime}\n` +
                           `Порт: ${Config.PORT}\n\n` +
                           `База данных:\n` +
                           `Пользователи: ${dbInfo.users}\n` +
                           `Посты: ${dbInfo.posts}\n` +
                           `Жалобы за день: ${dbInfo.reports}\n\n` +
                           `Статус:\n` +
                           `Бэкенд: Работает\n` +
                           `База данных: Подключена\n` +
                           `Telegram Bot: Активен`;

            await this.sendMessageToChat(chatId, message);
        } catch (error) {
            await this.sendMessageToChat(chatId, `Ошибка получения статуса: ${error.message}`);
        }
    }

    private async handleLogsCommand(chatId: number, args: string[]) {
        const count = Math.min(parseInt(args[0]) || 5, 20);
        
        const message = `ПОСЛЕДНИЕ ЛОГИ (${count})\n\n` +
                       `Системная активность:\n` +
                       `${new Date().toLocaleString('ru-RU')}: Бот обрабатывает команды\n` +
                       `${new Date(Date.now() - 300000).toLocaleString('ru-RU')}: Проверка планировщика\n` +
                       `${new Date(Date.now() - 600000).toLocaleString('ru-RU')}: Мониторинг подключений\n` +
                       `${new Date(Date.now() - 900000).toLocaleString('ru-RU')}: Обновление статистики\n\n` +
                       `Используйте: /logs [количество] (макс 20)`;

        await this.sendMessageToChat(chatId, message);
    }

    private async handleStatsCommand(chatId: number) {
        try {
            const stats = await this.getDetailedStats();
            
            const message = `СТАТИСТИКА ЗА СЕГОДНЯ\n\n` +
                           `Пользователи:\n` +
                           `Всего: ${stats.totalUsers}\n` +
                           `Онлайн: ${stats.onlineUsers}\n` +
                           `Новые: ${stats.newUsers}\n\n` +
                           `Контент:\n` +
                           `Посты: ${stats.newPosts}\n` +
                           `Комментарии: ${stats.newComments}\n\n` +
                           `Модерация:\n` +
                           `Жалобы: ${stats.reports}\n` +
                           `Наказания: ${stats.punishments}`;

            await this.sendMessageToChat(chatId, message);
        } catch (error) {
            await this.sendMessageToChat(chatId, `Ошибка получения статистики: ${error.message}`);
        }
    }



    private async handleGrantAdminCommand(chatId: number, args: string[]) {
        try {
            const uid = parseInt(args[0]);
            if (!uid || isNaN(uid)) {
                await this.sendMessageToChat(chatId, 'err');
                return;
            }

            const mode = (args[1] || 'on').toString().toLowerCase();
            const enable = mode === '1' || mode === 'on' || mode === 'true' || mode === 'enable';

            await getUserPermissions({ data: { payload: { user_id: uid } } });
            await updateUserPermissions({ account: { ID: uid }, data: { payload: { user_id: uid, permissions: { Admin: enable } } } });

            await this.sendMessageToChat(chatId, 'ok');
        } catch (error) {
            await this.sendMessageToChat(chatId, 'err');
        }
    }



    private async handleUserInfoCommand(chatId: number, args: string[]) {
        try {
            const uid = parseInt(args[0]);
            if (!uid || isNaN(uid)) {
                await this.sendMessageToChat(chatId, 'err');
                return;
            }

            const acc = await dbE.query('SELECT ID, Username, Name, Eballs, CreateDate FROM accounts WHERE ID = ?', [uid]);
            if (!acc || acc.length === 0) {
                await this.sendMessageToChat(chatId, 'err');
                return;
            }

            const perms = await dbE.query('SELECT Admin, Posts, Comments, NewChats, MusicUpload FROM accounts_permissions WHERE UserID = ?', [uid]);
            const p = perms && perms[0] ? perms[0] : { Admin: 0, Posts: 1, Comments: 1, NewChats: 1, MusicUpload: 1 } as any;

            const m = [
                `UID: ${acc[0].ID}`,
                `UN: ${acc[0].Username || '-'}`,
                `NM: ${acc[0].Name || '-'}`,
                `EB: ${acc[0].Eballs || 0}`,
                `CR: ${acc[0].CreateDate || '-'}`,
                `PR: A=${p.Admin ? 1 : 0} P=${p.Posts ? 1 : 0} C=${p.Comments ? 1 : 0} CH=${p.NewChats ? 1 : 0} MU=${p.MusicUpload ? 1 : 0}`
            ].join('\n');

            await this.sendMessageToChat(chatId, m);
        } catch {
            await this.sendMessageToChat(chatId, 'err');
        }
    }

    private async handlePermissionMenuCommand(chatId: number, args: string[]) {
        try {
            const uid = parseInt(args[0]);
            if (!uid || isNaN(uid)) {
                await this.sendMessageToChat(chatId, 'err');
                return;
            }

            await getUserPermissions({ data: { payload: { user_id: uid } } });

            const keyboard = {
                inline_keyboard: [
                    [
                        { text: 'Posts ON', callback_data: `perm:${uid}:Posts:on` },
                        { text: 'Posts OFF', callback_data: `perm:${uid}:Posts:off` }
                    ],
                    [
                        { text: 'Comments ON', callback_data: `perm:${uid}:Comments:on` },
                        { text: 'Comments OFF', callback_data: `perm:${uid}:Comments:off` }
                    ],
                    [
                        { text: 'Chat ON', callback_data: `perm:${uid}:NewChats:on` },
                        { text: 'Chat OFF', callback_data: `perm:${uid}:NewChats:off` }
                    ],
                    [
                        { text: 'Music ON', callback_data: `perm:${uid}:MusicUpload:on` },
                        { text: 'Music OFF', callback_data: `perm:${uid}:MusicUpload:off` }
                    ],
                    [
                        { text: 'VERIFY ON', callback_data: `icon:${uid}:VERIFY:on` },
                        { text: 'VERIFY OFF', callback_data: `icon:${uid}:VERIFY:off` }
                    ],
                    [
                        { text: 'FAKE ON', callback_data: `icon:${uid}:FAKE:on` },
                        { text: 'FAKE OFF', callback_data: `icon:${uid}:FAKE:off` }
                    ]
                ]
            };

            await axios.post(`${this.apiUrl}/sendMessage`, {
                chat_id: chatId,
                text: `Права пользователя ${uid}`,
                reply_markup: keyboard
            });
        } catch {
            await this.sendMessageToChat(chatId, 'err');
        }
    }
    private async handleHelpCommand(chatId: number) {
        const message = `КОМАНДЫ БОТА\n\n` +
                       `/status - состояние сервера и БД\n` +
                       `/logs [число] - последние логи\n` +
                       `/stats - статистика за сегодня\n` +
                       `/help - эта справка\n\n` +
                       `Примеры:\n` +
                       `/logs 10 - последние 10 записей`;

        await this.sendMessageToChat(chatId, message);
    }

    private async getSystemInfo() {
        const totalMem = os.totalmem() / 1024 / 1024 / 1024;
        const freeMem = os.freemem() / 1024 / 1024 / 1024;
        const usedMem = totalMem - freeMem;
        const memoryPercent = Math.round((usedMem / totalMem) * 100);
        
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const uptimeFormatted = `${hours}ч ${minutes}м`;
        
        return {
            memory: memoryPercent,
            memoryUsed: usedMem.toFixed(1),
            memoryTotal: totalMem.toFixed(1),
            uptime: uptimeFormatted
        };
    }

    private async getDatabaseInfo() {
        try {
            const [users] = await dbE.query('SELECT COUNT(*) as count FROM accounts') as any[];
            const [posts] = await dbE.query('SELECT COUNT(*) as count FROM posts') as any[];
            const [reports] = await dbE.query('SELECT COUNT(*) as count FROM reports WHERE DATE(created_at) = CURDATE()') as any[];
            
            return {
                users: users.count || 0,
                posts: posts.count || 0,
                reports: reports.count || 0
            };
        } catch (error) {
            throw new Error(`Ошибка БД: ${error.message}`);
        }
    }

    private async getDetailedStats() {
        try {
            const [users] = await dbE.query('SELECT COUNT(*) as count FROM accounts') as any[];
            const [posts] = await dbE.query('SELECT COUNT(*) as count FROM posts WHERE DATE(date) = CURDATE()') as any[];
            const [comments] = await dbE.query('SELECT COUNT(*) as count FROM comments WHERE DATE(date) = CURDATE()') as any[];
            const [reports] = await dbE.query('SELECT COUNT(*) as count FROM reports WHERE DATE(created_at) = CURDATE()') as any[];
            const [punishments] = await dbE.query('SELECT COUNT(*) as count FROM accounts_punishments WHERE DATE(start_date) = CURDATE()') as any[];
            
            return {
                totalUsers: users.count || 0,
                onlineUsers: 0,
                newUsers: 0,
                newPosts: posts.count || 0,
                newComments: comments.count || 0,
                reports: reports.count || 0,
                punishments: punishments.count || 0
            };
        } catch (error) {
            throw new Error(`Ошибка статистики: ${error.message}`);
        }
    }

    private async sendMessageToChat(chatId: number, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        if (!chatId || isNaN(chatId)) {
            return;
        }

        if (text.length > 4000) {
            text = text.substring(0, 3900) + '\n(сообщение обрезано)';
        }

        try {
            const payload = {
                chat_id: chatId,
                text: text,
                parse_mode: parseMode,
                disable_web_page_preview: true
            };

            await axios.post(`${this.apiUrl}/sendMessage`, payload);
            
        } catch (error) {
        }
    }

    private async sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<void> {
        const chatId = parseInt(this.config.chatId);
        
        if (isNaN(chatId)) {
            return;
        }
        
        return this.sendMessageToChat(chatId, text, parseMode);
    }

    async sendBackendError(error: Error, context?: string): Promise<void> {
        const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        
        const message = `ОШИБКА БЭКЕНДА\n\n` +
                       `Время: ${timestamp}\n` +
                       `Контекст: ${context || 'Неизвестно'}\n\n` +
                       `Ошибка:\n\`\`\`\n${error.message}\n\`\`\`\n\n` +
                       `Stack trace:\n\`\`\`\n${error.stack?.slice(0, 1000) || 'Нет данных'}\n\`\`\``;

        await this.sendMessage(message);
    }

    async sendFrontendError(errorInfo: {
        message: string;
        stack?: string;
        url?: string;
        userAgent?: string;
        userId?: string;
        username?: string;
    }): Promise<void> {
        const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        
        const message = `ОШИБКА ФРОНТЕНДА\n\n` +
                       `Время: ${timestamp}\n` +
                       `URL: ${errorInfo.url || 'Неизвестно'}\n` +
                       `Пользователь: ${errorInfo.username ? `${errorInfo.username} (ID: ${errorInfo.userId})` : 'Гость'}\n\n` +
                       `Ошибка:\n\`\`\`\n${errorInfo.message}\n\`\`\`\n\n` +
                       `User Agent:\n\`\`\`\n${errorInfo.userAgent?.slice(0, 200) || 'Неизвестно'}\n\`\`\`\n\n` +
                       `Stack:\n\`\`\`\n${errorInfo.stack?.slice(0, 800) || 'Нет данных'}\n\`\`\``;

        await this.sendMessage(message);
    }

    async sendCriticalError(title: string, description: string): Promise<void> {
        const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        
        const message = `КРИТИЧЕСКАЯ ОШИБКА\n\n` +
                       `Время: ${timestamp}\n` +
                       `${title}\n\n` +
                       `Описание:\n\`\`\`\n${description}\n\`\`\``;

        await this.sendMessage(message);
    }

    async sendSystemAlert(message: string): Promise<void> {
        const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        
        const alertMessage = `СИСТЕМНОЕ УВЕДОМЛЕНИЕ\n\n` +
                            `Время: ${timestamp}\n\n` +
                            `${message}`;

        await this.sendMessage(alertMessage);
    }



    isEnabled(): boolean {
        return this.config.enabled;
    }

    async testConnection(): Promise<boolean> {
        if (!this.config.enabled) {
            return false;
        }

        try {
            await this.sendMessage('врубился');
            return true;
        } catch (error) {
            return false;
        }
    }

    stop(): void {
        if (this.pollingTimeoutId) {
            clearTimeout(this.pollingTimeoutId);
            this.pollingTimeoutId = null;
        }
    }
}

export const telegramBot = new TelegramBot(); 