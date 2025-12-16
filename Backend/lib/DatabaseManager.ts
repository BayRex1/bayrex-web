import mysql, { Pool, PoolConnection } from 'mysql2/promise';

interface DBConfig {
	HOST: string;
	USER: string;
	PASSWORD: string;
	NAME: string;
}

export default class DatabaseManager {
	private pool: Pool;
	private transactionLock: Promise<void> = Promise.resolve();

	constructor(config: DBConfig) {
		this.pool = mysql.createPool({
			host: config.HOST,
			user: config.USER,
			password: config.PASSWORD,
			database: config.NAME,
			charset: 'utf8mb4',
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0
		});
	}

	public async query(sql: string, args: any[] = []): Promise<any> {
		try {
			const [rows]: any = await this.pool.query(sql, args);
			return rows;
		} catch (error) {
			console.error('Ошибка в query:', error);
			throw error;
		}
	}

	public async getOne<T = any>(sql: string, args: any[] = []): Promise<T | null> {
		try {
			const rows = await this.query(sql, args);
			return rows.length > 0 ? rows[0] : null;
		} catch (error) {
			console.error('Ошибка в getOne:', error);
			throw error;
		}
	}

	public async getConnection(): Promise<PoolConnection> {
		try {
			return await this.pool.getConnection();
		} catch (error) {
			console.error('Ошибка при получении соединения:', error);
			throw error;
		}
	}

	public async withTransaction<T>(
		callback: (conn: PoolConnection) => Promise<T>
	): Promise<T> {
		// Здесь мы создаём "замок", ждём пока предыдущий транзакционный вызов завершится
		let releaseLock: () => void;
		const lockPromise = new Promise<void>(resolve => {
			releaseLock = resolve;
		});

		// Сохраняем текущий замок в очередь
		const previousLock = this.transactionLock;
		this.transactionLock = previousLock.then(() => lockPromise);

		// Ждём освобождения предыдущего замка
		await previousLock;

		// Теперь у нас "эксклюзивный доступ"
		const conn = await this.getConnection();
		try {
			await conn.beginTransaction();
			const result = await callback(conn);
			await conn.commit();
			return result;
		} catch (error) {
			await conn.rollback();
			console.error('Ошибка в транзакции:', error);
			throw error;
		} finally {
			conn.release();
			// Освобождаем замок, чтобы следующий в очереди мог начать транзакцию
			releaseLock!();
		}
	}
}
