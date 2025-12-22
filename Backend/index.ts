// Backend/index.ts - ES модули версия

// ============ НАЧАЛО: БЛОКИРОВКА REDIS ДЛЯ ES МОДУЛЕЙ ============
console.log('🛡️  Активирую защиту от Redis ошибок (ES модули)...');

// 1. Создаем глобальную заглушку для ioredis
class RedisStub {
  constructor(options?: any) {
    console.log('📦 RedisStub создан. Реальный Redis отключен.');
  }
  
  async connect() { 
    return Promise.resolve(); 
  }
  
  async get() { 
    return Promise.resolve(null); 
  }
  
  async set() { 
    return Promise.resolve('OK'); 
  }
  
  async quit() { 
    return Promise.resolve('OK'); 
  }
  
  async disconnect() { 
    return Promise.resolve(); 
  }
  
  on() { return this; }
  once() { return this; }
  off() { return this; }
}

// 2. Подменяем глобальные методы для блокировки сетевых подключений
if (typeof process !== 'undefined') {
  // Создаем динамический импорт для net модуля
  import('net').then(net => {
    const originalConnect = net.Socket.prototype.connect;
    
    net.Socket.prototype.connect = function(...args: any[]) {
      // Проверяем, не пытается ли подключиться к Redis
      let port = 0;
      let host = '';
      
      if (args.length >= 2 && typeof args[1] === 'number') {
        port = args[1];
      } else if (args[0] && typeof args[0] === 'object') {
        port = args[0].port || 0;
        host = args[0].host || '';
      }
      
      // Redis порты: 6379, 6380
      if (port === 6379 || port === 6380 || 
          (typeof host === 'string' && (host.includes('redis') || host.includes('redislabs')))) {
        console.log(`🔴 Блокирую подключение к Redis (${host}:${port})`);
        
        // Эмулируем мгновенную ошибку подключения
        setTimeout(() => {
          if (typeof this.emit === 'function') {
            this.emit('error', new Error('REDIS_DISABLED: Используется режим без БД'));
          }
        }, 10);
        
        return this;
      }
      
      return originalConnect.apply(this, args);
    };
    console.log('✅ Блокировка сетевых подключений установлена');
  }).catch(() => {
    console.log('⚠️  Не удалось импортировать net модуль');
  });
}

// 3. Monkey-patch для динамических импортов (import())
const originalImport = (globalThis as any).import;
if (originalImport) {
  (globalThis as any).import = function(specifier: string) {
    // Перехватываем импорт ioredis
    if (specifier.includes('ioredis') || specifier.includes('/redis')) {
      console.log('🔴 Блокирую динамический импорт Redis:', specifier);
      return Promise.resolve({
        default: RedisStub,
        Redis: RedisStub,
        Cluster: RedisStub
      });
    }
    return originalImport(specifier);
  };
}

console.log('✅ Защита от Redis ошибок активирована');
// ============ КОНЕЦ БЛОКИРОВКИ REDIS ============

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
  // Пробуем импортировать, но если модули используют БД/Redis - будут ошибки
  const schedulerModule = await import('./services/system/PunishmentScheduler.js');
  const telegramModule = await import('./services/system/TelegramBot.js');
  
  punishmentScheduler = schedulerModule.punishmentScheduler;
  telegramBot = telegramModule.telegramBot;
  
  console.log('✅ Модули загружены');
} catch (error) {
  console.log('⚠️  Некоторые модули не загрузились:', error.message);
  console.log('🔄 Создаём заглушки...');
  
  // Создаём заглушки
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

process.on('uncaughtException', (error) => {
  const errorMessage = error.message || String(error);
  if (!errorMessage.includes('REDIS_DISABLED') && !errorMessage.includes('ioredis')) {
    console.error('Необработанное исключение:', error);
    if (telegramBot.isEnabled()) {
      telegramBot.sendBackendError(error, 'Uncaught Exception');
    }
  }
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  const errorMessage = error.message || String(reason);
  
  if (!errorMessage.includes('REDIS_DISABLED') && !errorMessage.includes('ioredis')) {
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
