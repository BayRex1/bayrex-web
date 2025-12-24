// authorization.ts
// УБЕРИТЕ создание memoryStorage в начале файла - оно уже есть в AccountManager.js

import AccountManager from '../../system/global/AccountManager.js';
import { getSession } from '../../system/global/AccountManager.js'; // Уже есть этот экспорт
import LinkManager from '../../services/account/LinkManager.js';

const connect = async (ws, data) => {
  if (!data?.S_KEY) {
    return 'S-KEY не найден.';
  }

  console.log(`🔍 Ищем сессию по S_KEY: ${data.S_KEY.substring(0, 10)}...`);

  // Используем существующий метод getSession из AccountManager
  const sessionData = await getSession(data.S_KEY);
  
  if (!sessionData || !sessionData.ID) {
    console.log(`❌ Сессия не найдена для S_KEY: ${data.S_KEY.substring(0, 10)}...`);
    return { status: 'error', message: 'S-KEY не актуален.' };
  }

  console.log(`✅ Сессия найдена для пользователя ID: ${sessionData.ID}`);

  // Создаем AccountManager для этого пользователя
  const accountManager = new AccountManager(sessionData.ID);
  
  // Получаем данные аккаунта
  const accountData = await accountManager.getAccountData();
  
  if (!accountData) {
    return { status: 'error', message: 'Аккаунт не найден.' };
  }

  // Получаем дополнительные данные
  const linkManager = new LinkManager(sessionData.ID);
  let goldStatus, permissions, channels, goldHistory, links, messengerNotifications;
  
  try {
    goldStatus = await accountManager.getGoldStatus();
    permissions = await accountManager.getPermissions();
    channels = await accountManager.getChannels();
    goldHistory = await accountManager.getGoldHistory();
    links = await linkManager.getLinks();
    messengerNotifications = await accountManager.getMessengerNotifications();
  } catch (error) {
    console.log(`⚠️ Ошибка при получении дополнительных данных: ${error.message}`);
    // Устанавливаем значения по умолчанию
    goldStatus = { activated: false };
    permissions = {
      Posts: true,
      Comments: true,
      NewChats: true,
      MusicUpload: false,
      Admin: false,
      Verified: false,
      Fake: false
    };
    channels = [];
    goldHistory = [];
    links = [];
    messengerNotifications = 0;
  }

  // Обновляем сессию с WebSocket (используем статический метод)
  await AccountManager.updateSession(data.S_KEY, { 
    connection: ws,
    lastActive: new Date().toISOString()
  });

  // Устанавливаем аккаунт в WebSocket
  ws.account = { 
    ...accountData,
    permissions: permissions,
    s_key: data.S_KEY
  };

  console.log(`✅ Успешное подключение: ${accountData.Username}`);

  return {
    status: 'success',
    accountData: {
      id: accountData.ID,
      name: accountData.Name,
      username: accountData.Username,
      email: accountData.Email,
      avatar: accountData.Avatar,
      cover: accountData.Cover,
      description: accountData.Description,
      e_balls: accountData.Eballs || 0,
      permissions: permissions,
      channels: channels,
      gold_status: goldStatus && goldStatus.activated || false,
      gold_history: goldHistory,
      links: links,
      messenger_notifications: messengerNotifications,
      notifications: 0,
    }
  }
}

const logout = async (ws, data) => {
  if (!data.S_KEY) {
    return { status: 'error', message: 'S-KEY не найден' };
  }

  // Используем метод logout из AccountManager
  await AccountManager.logout(data.S_KEY);

  if (ws.account?.s_key === data.S_KEY) {
    ws.account = null;
  }

  return { status: 'success' };
}

const handlers = {
  connect: connect,
  logout: logout
}

const authorization = async (ws, action, data) => {
  if (!handlers[action]) {
    return { status: 'error', message: 'Такого действия нет' };
  }

  const result = await handlers[action](ws, data);
  return { action, ...result };
};

export default authorization;
