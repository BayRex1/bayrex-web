// Backend/system/global/AppSessionManager.ts
// ВАЖНО: Полностью независимая версия без импорта dbA

console.log('🎯 AppSessionManager: используем память вместо Redis и БД');

interface AppSession {
    ws: any;
    lastActive: number;
    data: any;
}

class AppSessionManager {
    private activeConnections: Map<string, AppSession>;
    private mockApps: Map<string, any>; // Заглушка для хранения "приложений"

    constructor() {
        this.activeConnections = new Map();
        this.mockApps = new Map();
        this.initializeMockData();
        console.log('✅ AppSessionManager создан (режим без Redis и без БД)');
    }

    private initializeMockData() {
        // Создаем несколько тестовых приложений для демонстрации
        const mockApps = [
            {
                id: "1",
                name: "Test App 1",
                api_key: "test_key_1",
                status: "active",
                created_at: new Date().toISOString()
            },
            {
                id: "2", 
                name: "Test App 2",
                api_key: "test_key_2",
                status: "active",
                created_at: new Date().toISOString()
            }
        ];

        mockApps.forEach(app => {
            this.mockApps.set(app.api_key, app);
        });
        console.log(`📋 Загружено ${mockApps.length} тестовых приложений`);
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
        const deleted = this.activeConnections.delete(id);
        if (deleted) {
            console.log(`🗑️  Сессия приложения удалена: ${id}`);
        }
        return deleted;
    }

    getSessions() {
        const result: Record<string, any> = {};
        this.activeConnections.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    async updateSession(id: string, newData: any) {
        const connection = this.activeConnections.get(id);
        if (connection) {
            connection.data = {
                ...connection.data,
                ...newData
            };
            connection.lastActive = Date.now();
            this.activeConnections.set(id, connection);
            console.log(`🔄 Сессия приложения обновлена: ${id}`);
            return true;
        }
        return false;
    }

    async connectAccount({ api_key, ws }: { api_key: string; ws: any }) {
        console.log(`🔑 Попытка подключения приложения с ключом: ${api_key?.substring(0, 10)}...`);
        
        // ВМЕСТО запроса к БД используем заглушку
        const app = this.mockApps.get(api_key);
        
        if (!app || !app.id) {
            console.log(`❌ Приложение не найдено по ключу: ${api_key?.substring(0, 10)}...`);
            return false;
        }

        const appID = app.id.toString();
        
        await this.createSession({
            id: appID,
            ws: ws,
            data: app
        });
        
        await this.updateSession(appID, {
            aesKey: ws.keys?.user?.aes, // Опциональная цепочка
            connectedAt: new Date().toISOString(),
            wsId: ws.id || 'unknown'
        });
        
        console.log(`✅ Приложение подключено: ${app.name || appID}`);
        return app;
    }

    // Дополнительные методы для управления
    async cleanupInactiveSessions(maxAgeMinutes: number = 60) {
        const cutoffTime = Date.now() - (maxAgeMinutes * 60 * 1000);
        let cleanedCount = 0;

        for (const [id, session] of this.activeConnections.entries()) {
            if (session.lastActive < cutoffTime) {
                await this.deleteSession(id);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Очищено ${cleanedCount} неактивных сессий`);
        }
        
        return cleanedCount;
    }

    getStats() {
        return {
            activeSessions: this.activeConnections.size,
            mockAppsCount: this.mockApps.size,
            totalUsers: Array.from(this.activeConnections.values())
                .filter(s => s.data && s.data.userId)
                .length
        };
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
    },
    expire: async (key: string, seconds: number) => {
        console.log(`📦 AppSessionManager Redis.expire("${key}", ${seconds}) -> 1`);
        return 1;
    }
};

// Экспортируем для обратной совместимости (если другие модули ожидают dbA)
export const dbA = {
    query: async (sql: string, params: any[] = []) => {
        console.log(`📦 AppSessionManager dbA.query("${sql.substring(0, 50)}...") -> []`);
        return [];
    }
};
