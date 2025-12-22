// ВАЖНО: правильный путь импорта
import { dbA } from '../../../lib/db.ts';

console.log('🎯 AppSessionManager: используем память вместо Redis');

interface AppSession {
    ws: any;
    lastActive: number;
    data: any;
}

class AppSessionManager {
    private activeConnections: Map<string, AppSession>;

    constructor() {
        this.activeConnections = new Map();
        console.log('✅ AppSessionManager создан (режим без Redis)');
    }

    async createSession({ id, ws, data }: { id: string; ws: any; data: any }) {
        try {
            // Сохраняем в память
            this.activeConnections.set(id, { 
                ws: ws, 
                lastActive: Date.now(),
                data: data
            });
            console.log(`✅ Сессия приложения создана: ${id}`);
        } catch (error: any) {
            console.error(`Ошибка при создании сессии для приложения ${id}:`, error.message);
        }
    }

    async getSession(id: string) {
        try {
            const connection = this.activeConnections.get(id);
            if (!connection) {
                return null;
            }
            
            return {
                ...connection.data,
                connection: connection
            };
        } catch (error: any) {
            console.error(`Ошибка при получении сессии ${id}:`, error.message);
            return null;
        }
    }

    async deleteSession(id: string) {
        this.activeConnections.delete(id);
        console.log(`🗑️  Сессия приложения удалена: ${id}`);
    }

    getSessions() {
        return Object.fromEntries(this.activeConnections);
    }

    async updateSession(id: string, newData: any) {
        const connection = this.activeConnections.get(id);
        if (connection) {
            connection.data = {
                ...connection.data,
                ...newData
            };
            this.activeConnections.set(id, connection);
            console.log(`🔄 Сессия приложения обновлена: ${id}`);
        }
    }

    async connectAccount({ api_key, ws }: { api_key: string; ws: any }) {
        // Используем dbA из правильного импорта
        const app = await dbA.query('SELECT * FROM `apps` WHERE `api_key` = ?', [api_key]);

        if (!app || app.length === 0 || !app[0].id) {
            console.log(`❌ Приложение не найдено по ключу: ${api_key?.substring(0, 10)}...`);
            return false;
        }

        const appID = app[0].id.toString();
        await this.createSession({
            id: appID,
            ws: ws,
            data: app[0]
        });
        
        await this.updateSession(appID, {
            aesKey: ws.keys?.user?.aes // Опциональная цепочка
        });
        
        console.log(`✅ Приложение подключено: ${app[0].name || appID}`);
        return app[0];
    }
}

// Экспортируем синглтон
const appSessionManager = new AppSessionManager();
export default appSessionManager;

// Экспортируем заглушку для обратной совместимости
export const redis = {
    get: async (key: string) => {
        console.log(`📦 AppSessionManager Redis.get("${key}") -> null`);
        return null;
    },
    set: async (key: string, value: any) => {
        console.log(`📦 AppSessionManager Redis.set("${key}") -> OK`);
        return 'OK';
    },
    del: async (key: string) => {
        console.log(`📦 AppSessionManager Redis.del("${key}") -> 1`);
        return 1;
    }
};
