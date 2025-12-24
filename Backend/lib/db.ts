// lib/db.ts - мок базы данных с тестовыми данными
console.log('📦 Создаю мок-базу данных с тестовыми аккаунтами');

// Тестовые данные для аккаунтов
const mockAccounts = [
    {
        ID: 1,
        Name: 'Тестовый пользователь',
        Username: 'testuser',
        Email: 'test@example.com',
        Password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.MH/y5g6Rk/6R7vJX6O6U5Uc8QJQ5aK', // bcrypt hash для 'test123'
        CreateDate: new Date().toISOString(),
        Avatar: null,
        Cover: null,
        Description: 'Тестовый аккаунт',
        Eballs: 1000,
        Notifications: 0,
        messenger_size: 0,
        Keyword: 1
    },
    {
        ID: 2,
        Name: 'BayRex',
        Username: 'bayrex',
        Email: 'bayrex@gmail.com',
        Password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.MH/y5g6Rk/6R7vJX6O6U5Uc8QJQ5aK', // bcrypt hash для 'test123'
        CreateDate: new Date().toISOString(),
        Avatar: null,
        Cover: null,
        Description: 'Разработчик',
        Eballs: 5000,
        Notifications: 3,
        messenger_size: 0,
        Keyword: 0
    }
];

// Тестовые сообщения
const mockMessages = [
    {
        id: 1,
        uid: 1,
        encrypted: 'mock_encrypted_message_1',
        chat_id: 1,
        date: new Date().toISOString()
    }
];

class MockDatabase {
    private name: string;
    
    constructor(dbName: string) {
        this.name = dbName;
        console.log(`📦 Создан мок для базы: ${dbName}`);
    }
    
    async query(sql: string, params: any[] = []) {
        const sqlPreview = sql.length > 80 ? sql.substring(0, 80) + '...' : sql;
        console.log(`📦 [${this.name}] Mock query: ${sqlPreview}`, params.length > 0 ? `Params: ${JSON.stringify(params)}` : '');
        
        // ========== ОБРАБОТКА dbA ЗАПРОСОВ (Accounts) ==========
        if (this.name === 'dbA') {
            // SELECT * FROM accounts WHERE Username = ? OR Email = ?
            if (sql.includes('SELECT') && sql.includes('accounts') && (sql.includes('Username') || sql.includes('Email'))) {
                console.log(`📦 [${this.name}] Поиск аккаунта по логину/email`);
                
                if (params.length > 0) {
                    const identifier = params[0];
                    const account = mockAccounts.find(acc => 
                        acc.Username === identifier || acc.Email === identifier
                    );
                    
                    if (account) {
                        console.log(`✅ [${this.name}] Аккаунт найден: ${account.Username}`);
                        return [account];
                    } else {
                        console.log(`❌ [${this.name}] Аккаунт не найден: ${identifier}`);
                        return [];
                    }
                }
                return mockAccounts;
            }
            
            // SELECT * FROM accounts WHERE ID = ?
            if (sql.includes('SELECT') && sql.includes('accounts') && sql.includes('ID')) {
                if (params.length > 0) {
                    const accountId = params[0];
                    const account = mockAccounts.find(acc => acc.ID === accountId);
                    return account ? [account] : [];
                }
            }
        }
        
        // ========== ОБРАБОТКА dbE ЗАПРОСОВ (Events) ==========
        if (this.name === 'dbE') {
            // SELECT * FROM accounts WHERE ID = ? AND Keyword = 1
            if (sql.includes('SELECT') && sql.includes('accounts') && sql.includes('Keyword')) {
                console.log(`📦 [${this.name}] Проверка Keyword для аккаунта`);
                
                if (params.length > 0) {
                    const accountId = params[0];
                    const account = mockAccounts.find(acc => acc.ID === accountId && acc.Keyword === 1);
                    return account ? [account] : [];
                }
                return mockAccounts.filter(acc => acc.Keyword === 1);
            }
            
            // UPDATE accounts SET Keyword = 1 WHERE ID = ?
            if (sql.includes('UPDATE') && sql.includes('accounts') && sql.includes('Keyword')) {
                console.log(`📦 [${this.name}] Обновление Keyword для аккаунта`);
                return { affectedRows: 1 };
            }
        }
        
        // ========== ОБРАБОТКА dbM ЗАПРОСОВ (Messenger) ==========
        if (this.name === 'dbM') {
            // SELECT * FROM messages WHERE uid = ? LIMIT 1
            if (sql.includes('SELECT') && sql.includes('messages') && sql.includes('uid')) {
                console.log(`📦 [${this.name}] Поиск сообщений пользователя`);
                
                if (params.length > 0) {
                    const userId = params[0];
                    const message = mockMessages.find(msg => msg.uid === userId);
                    return message ? [message] : [];
                }
                return mockMessages;
            }
            
            // INSERT INTO files (chat_id, pool, name, size) VALUES (?, ?, ?, ?)
            if (sql.includes('INSERT INTO `files`')) {
                const insertId = Math.floor(Math.random() * 10000) + 1;
                console.log(`📦 [${this.name}] Возвращаем insertId: ${insertId}`);
                return { insertId: insertId, affectedRows: 1 };
            }
            
            // UPDATE files SET chat_id = ? WHERE id = ?
            if (sql.includes('UPDATE `files`')) {
                console.log(`📦 [${this.name}] Обновление файла`);
                return { affectedRows: 1 };
            }
        }
        
        // ========== ОБЩАЯ ОБРАБОТКА ==========
        
        // Для INSERT возвращаем insertId
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
            const insertId = Math.floor(Math.random() * 1000) + 1000;
            console.log(`📦 [${this.name}] INSERT -> insertId: ${insertId}`);
            return { insertId: insertId, affectedRows: 1 };
        }
        
        // Для SELECT ... COUNT(*) запросов
        if (sql.includes('COUNT(*)') || sql.includes('LIMIT 1')) {
            console.log(`📦 [${this.name}] COUNT/LIMIT запрос -> возвращаем пустой массив`);
            return [];
        }
        
        // Для обычных SELECT возвращаем пустой массив или тестовые данные
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            console.log(`📦 [${this.name}] SELECT запрос -> возвращаем пустой массив`);
            return [];
        }
        
        // Для UPDATE/DELETE возвращаем affectedRows
        if (sql.trim().toUpperCase().startsWith('UPDATE') || sql.trim().toUpperCase().startsWith('DELETE')) {
            console.log(`📦 [${this.name}] UPDATE/DELETE -> affectedRows: 1`);
            return { affectedRows: 1 };
        }
        
        // Для остальных запросов
        console.log(`📦 [${this.name}] Неизвестный запрос -> возвращаем пустой результат`);
        return [];
    }
    
    async execute(sql: string, params: any[] = []) {
        console.log(`📦 [${this.name}] Mock execute: ${sql.substring(0, 50)}...`);
        return await this.query(sql, params);
    }
}

// Экспортируем готовые инстансы
export const dbE = new MockDatabase('dbE');
export const dbM = new MockDatabase('dbM');
export const dbA = new MockDatabase('dbA');

console.log('✅ Мок-базы данных созданы с тестовыми аккаунтами');
console.log(`   testuser / test123 (ID: 1, Keyword: 1)`);
console.log(`   bayrex / test123 (ID: 2, Keyword: 0)`);
