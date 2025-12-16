import { Redis } from 'ioredis';
import { dbA } from '../../lib/db.js';

class AppSessionManager {
    private redis: Redis;
    private activeConnections: {
        [id: string]: 
        { ws: WebSocket, lastActive: number } 
    };

    constructor() {
        this.redis = new Redis();
        this.activeConnections = {};
    }

    async redisRetry(fn: Function, retries: number = 3) {
        let attempt = 0;
        while (attempt < retries) {
            try {
                return await fn();
            } catch (error) {
                attempt++;
                console.error(`Ошибка Redis, попытка ${attempt}: ${error.message}`);
                if (attempt >= retries) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async createSession({ id, ws, data }) {
        try {
            await this.redisRetry(() => this.redis.set(`session:${id}`, JSON.stringify(data)));
            this.activeConnections[id] = { ws: ws, lastActive: Date.now() };
        } catch (error) {
            console.error(`Ошибка при создании сессии для пользователя ${id}:`, error);
        }
    }

    async getSession(id: number) {
        return await this.redisRetry(async () => {
            const sessionData = await this.redis.get(`session:${id}`);

            return {
                ...(sessionData ? JSON.parse(sessionData) : {}),
                connection: this.activeConnections[id] || null
            };
        });
    }

    async deleteSession(id: number) {
        await this.redis.del(`session:${id}`);
        delete this.activeConnections[id];
    }

    getSessions() {
        return this.activeConnections;
    }

    async updateSession(id: number, newData: any) {
        const sessionKey = `session:${id}`;
        const currentData = await this.getSession(id);
        const updatedData = currentData ? { ...currentData, ...newData } : newData;
        await this.redis.set(sessionKey, JSON.stringify(updatedData));
    }

    async connectAccount({ api_key, ws }) {
        const app = await dbA.query('SELECT * FROM `apps` WHERE `api_key` = ?', [api_key]);

        if (!app || app.length === 0 || !app[0].id) return false;

        const appID = app[0].id;
        await this.createSession({
            id: appID,
            ws: ws,
            data: app[0]
        });
        await this.updateSession(appID, {
            aesKey: ws.keys.user.aes
        });
        return app[0];
    }
}

export default new AppSessionManager();
