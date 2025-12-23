// lib/db.ts - простой вариант
console.log('📦 Создаю мок-базу данных');

class MockDatabase {
    async query(sql: string, params: any[] = []) {
        const sqlPreview = sql.length > 50 ? sql.substring(0, 50) + '...' : sql;
        console.log(`📦 Mock DB query: ${sqlPreview}`);
        
        // Для INSERT возвращаем insertId
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
            const insertId = Math.floor(Math.random() * 1000) + 1000;
            console.log(`📦 Возвращаем insertId: ${insertId}`);
            return [{ insertId: insertId, affectedRows: 1 }];
        }
        
        // Для SELECT ... COUNT(*) запросов (проверка пользователя)
        if (sql.includes('COUNT(*)') || sql.includes('LIMIT 1')) {
            return []; // Пользователь не существует
        }
        
        // Для обычных SELECT
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            return [];
        }
        
        // Для остальных
        return [{ affectedRows: 1 }];
    }
}

// Экспортируем готовые инстансы
export const dbE = new MockDatabase();
export const dbM = new MockDatabase();
export const dbA = new MockDatabase();

console.log('✅ Мок-база данных создана');
