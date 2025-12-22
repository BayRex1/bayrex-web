import mysql from 'mysql2/promise';
import Config from '../system/global/Config.js';

class Database {
  constructor(config) {
    this.config = config;
    this.connection = null;
  }

  async connect() {
    if (Config.DEBUG.SKIP_DB) {
      console.log('⚠️  База данных отключена (режим отладки)');
      return null;
    }

    try {
      const sslConfig = this.config.SSL ? {
        rejectUnauthorized: true
      } : undefined;

      this.connection = await mysql.createConnection({
        host: this.config.HOST,
        port: this.config.PORT,
        user: this.config.USER,
        password: this.config.PASSWORD,
        database: this.config.NAME,
        ssl: sslConfig,
        connectTimeout: 10000
      });

      console.log(`✅ База данных подключена: ${this.config.NAME}`);
      return this.connection;
    } catch (error) {
      console.error(`❌ Ошибка подключения к БД ${this.config.NAME}:`, error.message);
      
      // Если база не критична, продолжаем работу
      if (this.config.NAME.includes('messenger') || this.config.NAME.includes('apps')) {
        console.log(`⚠️  Продолжаем работу без БД ${this.config.NAME}`);
        return null;
      }
      throw error;
    }
  }

  async query(sql, params) {
    if (!this.connection) {
      throw new Error('Нет подключения к БД');
    }
    return this.connection.execute(sql, params);
  }
}

// Создаем инстансы для каждой БД
export const elementDB = new Database(Config.ELEMENT_DATABASE);
export const messengerDB = new Database(Config.MESSENGER_DATABASE);
export const appsDB = new Database(Config.APPS_DATABASE);
