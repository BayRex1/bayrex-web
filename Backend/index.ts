import { createServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { WebSocketServer } from 'ws';
import userAPI from './user_api/index.js';
import appAPI from './app_api/index.js';
import Config from './system/global/Config.js';
import fs from 'fs';
import { punishmentScheduler } from './services/system/PunishmentScheduler.js';
import { telegramBot } from './services/system/TelegramBot.js';

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
  telegramBot.sendBackendError(error, 'Uncaught Exception');
});

process.on('unhandledRejection', (reason) => {
  console.error('Необработанное отклонение промиса:', reason);
  const error = reason instanceof Error ? reason : new Error(String(reason));
  telegramBot.sendBackendError(error, 'Unhandled Promise Rejection');
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
  console.log(`сервак тута ->  ${Config.PORT}`);

  punishmentScheduler.start();

  if (telegramBot.isEnabled()) {
    const isConnected = await telegramBot.testConnection();
    if (isConnected) {
      await telegramBot.sendSystemAlert(`запустился епта`);
    }
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
      userAPI(ws, request);
    });
  } else if (request.url === '/user_api_legacy') {
    userWS.handleUpgrade(request, socket, head, (ws) => {
      userAPI(ws, request, false);
    });
  } else if (request.url === '/app_api') {
    appWS.handleUpgrade(request, socket, head, (ws) => {
      appAPI(ws, request);
    });
  } else {
    socket.destroy();
  }
});
