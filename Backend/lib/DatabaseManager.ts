import mysql, { Pool, PoolConnection } from 'mysql2/promise';

interface DBConfig {
  HOST: string;
  PORT: number;
  USER: string;
  PASSWORD: string;
  NAME: string;
  SSL?: boolean;
}

export default class DatabaseManager {
  private pool: Pool | null = null;
  private isMock: boolean = false;
  private transactionLock: Promise<void> = Promise.resolve();

  constructor(config: DBConfig) {
    // ⬇⬇⬇ РЕЖИМ БЕЗ БД (заглушка) ⬇⬇⬇
    if (!config.HOST || config.HOST === 'localhost' || config.HOST.includes('127.0.0.1')) {
      console.log('🎯 DatabaseManager: РЕЖИМ БЕЗ БД (WebSocket будет работать)');
      console.log('📦 Данные хранятся в памяти, сбросятся при перезагрузке');
      this.isMock = true;
      return;
    }

    // ⬇⬇⬇ РЕАЛЬНОЕ ПОДКЛЮЧЕНИЕ К MYSQL ⬇⬇⬇
    try {
      this.pool = mysql.createPool({
        host: config.HOST,
        port: config.PORT || 3306,
        user: config.USER,
        password: config.PASSWORD,
        database: config.NAME,
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: config.SSL ? { rejectUnauthorized: true } : undefined
      });
      
      console.log(`✅ DatabaseManager создан для ${config.NAME}`);
    } catch (error) {
      console.error('❌ Ошибка создания пула соединений:', error);
      console.log('🔄 Переключаемся в режим без БД');
      this.isMock = true;
    }
  }

  // === ЗАГЛУШКИ ДЛЯ РЕЖИМА БЕЗ БД ===
  private mockData = {
    users: new Map(),
    messages: new Map(),
    chats: new Map()
  };

  public async query(sql: string, args: any[] = []): Promise<any> {
    // ⬇⬇⬇ РЕЖИМ БЕЗ БД ⬇⬇⬇
    if (this.isMock) {
      console.log(`📦 Mock DB query: ${sql.substring(0, 80)}...`);
      
      // Простые заглушки для основных запросов
      if (sql.includes('SELECT') && sql.includes('users')) {
        return Array.from(this.mockData.users.values());
      }
      if (sql.includes('SELECT') && sql.includes('msg_')) {
        return Array.from(this.mockData.messages.values());
      }
      if (sql.includes('INSERT') && sql.includes('users')) {
        const id = Date.now();
        const user = { id, username: args[0], email: args[1] };
        this.mockData.users.set(id, user);
        return { insertId: id };
      }
      
      return [];
    }

    // ⬇⬇⬇ РЕАЛЬНЫЙ ЗАПРОС К MYSQL ⬇⬇⬇
    try {
      const [rows]: any = await this.pool!.query(sql, args);
      return rows;
    } catch (error) {
      console.error('❌ Ошибка в query:', error.message);
      console.log('🔄 Возвращаем пустой результат');
      return [];
    }
  }

  public async getOne<T = any>(sql: string, args: any[] = []): Promise<T | null> {
    // ⬇⬇⬇ РЕЖИМ БЕЗ БД ⬇⬇⬇
    if (this.isMock) {
      console.log(`📦 Mock DB getOne: ${sql.substring(0, 80)}...`);
      
      if (sql.includes('users') && args.length > 0) {
        for (let user of this.mockData.users.values()) {
          if (user.email === args[0] || user.username === args[0]) {
            return user;
          }
        }
      }
      return null;
    }

    // ⬇⬇⬇ РЕАЛЬНЫЙ ЗАПРОС К MYSQL ⬇⬇⬇
    try {
      const rows = await this.query(sql, args);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('❌ Ошибка в getOne:', error.message);
      return null;
    }
  }

  public async getConnection(): Promise<PoolConnection> {
    if (this.isMock) {
      console.log('📦 Mock DB getConnection');
      return {} as PoolConnection; // Заглушка
    }
    
    try {
      return await this.pool!.getConnection();
    } catch (error) {
      console.error('❌ Ошибка при получении соединения:', error);
      throw error;
    }
  }

  public async withTransaction<T>(
    callback: (conn: PoolConnection) => Promise<T>
  ): Promise<T> {
    if (this.isMock) {
      console.log('📦 Mock DB withTransaction');
      return callback({} as PoolConnection);
    }

    // Оригинальный код транзакции
    let releaseLock: () => void;
    const lockPromise = new Promise<void>(resolve => {
      releaseLock = resolve;
    });

    const previousLock = this.transactionLock;
    this.transactionLock = previousLock.then(() => lockPromise);

    await previousLock;

    const conn = await this.getConnection();
    try {
      await conn.beginTransaction();
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      console.error('❌ Ошибка в транзакции:', error);
      throw error;
    } finally {
      conn.release();
      releaseLock!();
    }
  }

  // === ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ДЛЯ РЕЖИМА БЕЗ БД ===
  public isMockMode(): boolean {
    return this.isMock;
  }
  
  public getMockData() {
    return this.mockData;
  }
}
