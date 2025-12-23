// DatabaseManager.ts - просто заглушка
console.log('🎯 DatabaseManager: РЕЖИМ БЕЗ БД (данные в памяти)');

class DatabaseManager {
    async query(sql: string, params: any[] = []): Promise<any> {
        console.log(`📦 Mock DB (игнорируется): ${sql.substring(0, 50)}...`);
        
        // Всегда возвращаем успешный результат для INSERT
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
            console.log(`📦 Возвращаем фиктивный insertId: 1001`);
            return [{ insertId: 1001 }];
        }
        
        // Для SELECT запросов возвращаем пустой результат
        return [];
    }
}

export const dbE = new DatabaseManager();
export const dbM = new DatabaseManager();
export const dbA = new DatabaseManager();
