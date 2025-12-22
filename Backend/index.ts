import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { WebSocketServer } from 'ws';
import userAPI from './user_api/index.js';
import appAPI from './app_api/index.js';
import Config from './system/global/Config.js';
import fs from 'fs';

// === ДОБАВЬ ЭТО ПЕРЕД ИМПОРТАМИ ===
console.log('='.repeat(50));
console.log('🚀 ЗАПУСК СЕРВЕРА В РЕЖИМЕ БЕЗ БД И БЕЗ REDIS');
console.log('='.repeat(50));

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
  console.error('Необработанное исключение:', error);
  if (telegramBot.isEnabled()) {
    telegramBot.sendBackendError(error, 'Uncaught Exception');
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('Необработанное отклонение промиса:', reason);
  const error = reason instanceof Error ? reason : new Error(String(reason));
  if (telegramBot.isEnabled()) {
    telegramBot.sendBackendError(error, 'Unhandled Promise Rejection');
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
