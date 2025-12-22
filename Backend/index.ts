// Backend/index.ts - АГРЕССИВНАЯ БЛОКИРОВКА REDIS

// ============ САМОЕ НАЧАЛО: ГЛОБАЛЬНОЕ ПОДАВЛЕНИЕ REDIS ============
// Этот код должен быть САМЫМИ ПЕРВЫМИ СТРОЧКАМИ

// 1. Немедленно подавляем все ошибки Redis на уровне process
const originalEmit = process.emit;
process.emit = function(event: string | symbol, ...args: any[]): boolean {
  // Перехватываем события ошибок
  if (event === 'uncaughtException' || event === 'unhandledRejection') {
    const error = args[0];
    if (error && (
        (error.message && error.message.includes('ioredis')) ||
        (error.message && error.message.includes('ECONNREFUSED')) ||
        (error.code && error.code === 'ECONNREFUSED')
    )) {
      // Тихо игнорируем ошибки Redis
      return true;
    }
  }
  return originalEmit.apply(process, args);
};

// 2. Подавляем console.error для Redis логов
const originalConsoleError = console.error;
console.error = function(...args: any[]) {
  const firstArg = args[0];
  if (firstArg && (
      (typeof firstArg === 'string' && firstArg.includes('[ioredis]')) ||
      (typeof firstArg === 'string' && firstArg.includes('ECONNREFUSED')) ||
      (args[1] && typeof args[1] === 'string' && args[1].includes('Redis'))
  )) {
    // Не выводим ошибки Redis
    return;
  }
  originalConsoleError.apply(console, args);
};

// 3. Перехватываем глобальный fetch/import для блокировки Redis
const originalGlobalImport = globalThis.import;
if (originalGlobalImport) {
  globalThis.import = function(specifier: string) {
    if (typeof specifier === 'string' && (
        specifier.includes('ioredis') || 
        specifier.includes('/redis') ||
        specifier === 'redis' ||
        specifier === 'ioredis'
    )) {
      console.log('🔴 Блокирую импорт Redis:', specifier);
      
      // Возвращаем заглушку
      const RedisStub = class {
        constructor(options?: any) {
          console.log('📦 RedisStub создан вместо реального Redis');
        }
        
        async connect() { return Promise.resolve(); }
        async get() { return Promise.resolve(null); }
        async set() { return Promise.resolve('OK'); }
        async quit() { return Promise.resolve('OK'); }
        async disconnect() { return Promise.resolve(); }
        on() { return this; }
        once() { return this; }
        off() { return this; }
        removeAllListeners() { return this; }
      };
      
      return Promise.resolve({
        default: RedisStub,
        Redis: RedisStub,
        Cluster: RedisStub
      });
    }
    return originalGlobalImport(specifier);
  };
}

// 4. Блокируем все попытки создания сетевых подключений к портам Redis
// Делаем это асинхронно, чтобы не блокировать запуск
setImmediate(async () => {
  try {
    const net = await import('net');
    const originalConnect = net.Socket.prototype.connect;
    
    net.Socket.prototype.connect = function(...args: any[]) {
      // Определяем порт и хост
      let port = 0;
      let host = '';
      
      if (args.length >= 2 && typeof args[1] === 'number') {
        port = args[1];
        host = typeof args[0] === 'string' ? args[0] : '';
      } else if (args[0] && typeof args[0] === 'object') {
        port = args[0].port || 0;
        host = args[0].host || '';
      }
      
      // Блокируем Redis порты
      if (port === 6379 || port === 6380 || 
          (typeof host === 'string' && host.includes('redis'))) {
        console.log(`🔴 Блокировано подключение к Redis на ${host}:${port}`);
        
        // Немедленно эмулируем ошибку
        process.nextTick(() => {
          if (typeof this.emit === 'function') {
            this.emit('error', new Error('Redis отключен'));
          }
          if (typeof this.destroy === 'function') {
            this.destroy();
          }
        });
        
        return this;
      }
      
      return originalConnect.apply(this, args);
    };
    
    console.log('✅ Сетевые подключения к Redis заблокированы');
  } catch (error) {
    console.log('⚠️  Не удалось заблокировать сетевые подключения:', error.message);
  }
});

console.log('🛡️  Агрессивная защита от Redis активирована');
// ============ КОНЕЦ ГЛОБАЛЬНОГО ПОДАВЛЕНИЯ ============

console.log('='.repeat(50));
console.log('🚀 ЗАПУСК СЕРВЕРА В РЕЖИМЕ БЕЗ БД И БЕЗ REDIS');
console.log('='.repeat(50));

import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { WebSocketServer } from 'ws';
import userAPI from './user_api/index.js';
import appAPI from './app_api/index.js';
import Config from './system/global/Config.js';
import fs from 'fs';

// === УСЛОВНЫЙ ИМПОРТ ДЛЯ TELEGRAM ===
let punishmentScheduler, telegramBot;

try {
  const schedulerModule = await import('./services/system/PunishmentScheduler.js');
  const telegramModule = await import('./services/system/TelegramBot.js');
  
  punishmentScheduler = schedulerModule.punishmentScheduler;
  telegramBot = telegramModule.telegramBot;
  
  console.log('✅ Модули загружены');
} catch (error) {
  console.log('⚠️  Некоторые модули не загрузились:', error.message);
  console.log('🔄 Создаём заглушки...');
  
  punishmentScheduler = {
    start: () => console.log('📦 PunishmentScheduler (заглушка)'),
    stop: () => {}
  };
  
  telegramBot = {
    isEnabled: () => false,
    sendSystemAlert: async () => {},
    sendBackendError: async () => {},
    testConnection: async () => false,
    stop: () => {}
  };
}

const shutdown = async (signal: 'SIGINT' | 'SIGTERM') => {
  console.log(`Получен ${signal}, завершаем работу...`);

  if (telegramBot.isEnabled()) {
    const msg = signal === 'SIGINT' ? 'сервер спит' : 'сервер проснулся';
    await telegramBot.sendSystemAlert(msg);
  }

  punishmentScheduler.stop();
  telegramBot.stop();

  server.close(() => {
    console.log('Сервер закрыт');
    process.exit(0);
  });
};

// Эти обработчики уже настроены выше, но оставляем для других ошибок
process.on('uncaughtException', (error) => {
  if (!error.message?.includes('Redis') && !error.message?.includes('ioredis')) {
    console.error('Необработанное исключение:', error);
    if (telegramBot.isEnabled()) {
      telegramBot.sendBackendError(error, 'Uncaught Exception');
    }
  }
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  if (!error.message?.includes('Redis') && !error.message?.includes('ioredis')) {
    console.error('Необработанное отклонение промиса:', reason);
    if (telegramBot.isEnabled()) {
      telegramBot.sendBackendError(error, 'Unhandled Promise Rejection');
    }
  }
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

let server: any;

if (Config.USE_HTTPS) {
  const options: any = {
    key: fs.readFileSync(Config.SSL.KEY),
    cert: fs.readFileSync(Config.SSL.CERT)
  };
  if (Config.SSL.CA) {
    options.ca = fs.readFileSync(Config.SSL.CA);
  }
  server = createHttpsServer(options, (_, res) => {
    res.writeHead(404);
    res.end();
  });
} else {
  server = createServer((_, res) => {
    res.writeHead(404);
    res.end();
  });
}

server.listen(Config.PORT, async () => {
  console.log(`✅ сервак тута -> ${Config.PORT}`);
  console.log(`🌐 WebSocket: wss://bayrex-backend.onrender.com/user_api`);
  console.log(`🌐 WebSocket: wss://bayrex-backend.onrender.com/app_api`);
  console.log(`🌐 WebSocket: wss://bayrex-backend.onrender.com/user_api_legacy`);

  punishmentScheduler.start();

  if (telegramBot.isEnabled()) {
    const isConnected = await telegramBot.testConnection();
    if (isConnected) {
      await telegramBot.sendSystemAlert(`запустился епта`);
    }
  } else {
    console.log('🤖 Telegram бот отключён');
  }
});

const userWS = new WebSocketServer({
  noServer: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      level: 9,
    },
    threshold: 1024,
    serverNoContextTakeover: true,
    clientNoContextTakeover: true
  },
});

const appWS = new WebSocketServer({
  noServer: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      level: 9,
    },
    threshold: 1024,
    serverNoContextTakeover: true,
    clientNoContextTakeover: true
  },
});

server.on('upgrade', (request, socket, head) => {
  if (request.url === '/user_api') {
    userWS.handleUpgrade(request, socket, head, (ws) => {
      console.log('🔌 Новое WebSocket подключение: /user_api');
      userAPI(ws, request);
    });
  } else if (request.url === '/user_api_legacy') {
    userWS.handleUpgrade(request, socket, head, (ws) => {
      console.log('🔌 Новое WebSocket подключение: /user_api_legacy');
      userAPI(ws, request, false);
    });
  } else if (request.url === '/app_api') {
    appWS.handleUpgrade(request, socket, head, (ws) => {
      console.log('🔌 Новое WebSocket подключение: /app_api');
      appAPI(ws, request);
    });
  } else {
    console.log(`❌ Неизвестный WebSocket endpoint: ${request.url}`);
    socket.destroy();
  }
});

console.log('='.repeat(50));
console.log('✅ Сервер готов к подключениям');
console.log('='.repeat(50));
