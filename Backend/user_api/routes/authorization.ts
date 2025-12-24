// authorization.ts
import AccountManager from '../../system/global/AccountManager.js';
import LinkManager from '../../services/account/LinkManager.js';

const connect = async (ws, data) => {
  if (!data?.S_KEY) {
    return 'S-KEY не найден.';
  }

  console.log(`🔍 Ищем сессию в памяти по S_KEY: ${data.S_KEY.substring(0, 10)}...`);

  // 1. Ищем сессию в памяти
  const session = memoryStorage.sessions.get(data.S_KEY);
  
  if (!session) {
    console.log(`❌ Сессия не найдена в памяти для S_KEY: ${data.S_KEY.substring(0, 10)}...`);
    return { status: 'error', message: 'S-KEY не актуален.' };
  }
  
  console.log(`✅ Сессия найдена в памяти для UID: ${session.uid}`);

  // 2. Ищем аккаунт в памяти
  const account = memoryStorage.accounts.get(session.uid);
  if (!account) {
    console.log(`❌ Аккаунт не найден в памяти для UID: ${session.uid}`);
    return { status: 'error', message: 'Аккаунт не найден.' };
  }

  console.log(`✅ Аккаунт найден: ${account.Username} (ID: ${account.ID})`);

  // 3. Обновляем сессию (добавляем WebSocket и время активности)
  session.connection = ws;
  session.lastActive = Date.now();
  memoryStorage.sessions.set(data.S_KEY, session);

  // 4. Создаем менеджеры и получаем данные
  const accountManager = new AccountManager(account.ID);
  const linkManager = new LinkManager(account.ID);
  
  let goldStatus = false;
  let permissions = {};
  let channels = [];
  let goldHistory = [];
  let links = [];
  let messengerNotifications = 0;
  let notifications = 0;

  try {
    // Пытаемся получить данные через AccountManager
    permissions = await accountManager.getPermissions() || getDefaultPermissions();
    goldStatus = await accountManager.getGoldStatus() || { activated: false };
    channels = await accountManager.getChannels() || [];
    goldHistory = await accountManager.getGoldHistory() || [];
    links = await linkManager.getLinks() || [];
    messengerNotifications = await accountManager.getMessengerNotifications() || 0;
    
  } catch (error) {
    console.log(`⚠️ Ошибка при получении дополнительных данных: ${error.message}`);
    // Устанавливаем значения по умолчанию при ошибке
    permissions = getDefaultPermissions();
  }

  // 5. Сохраняем аккаунт в WebSocket соединение
  ws.account = { 
    ID: account.ID,
    Name: account.Name,
    Username: account.Username,
    Email: account.Email,
    Avatar: account.Avatar,
    Cover: account.Cover,
    Description: account.Description,
    Eballs: account.Eballs || 0,
    permissions: permissions,
    s_key: data.S_KEY
  };

  console.log(`✅ Успешное подключение: ${account.Username}`);

  // 6. Возвращаем данные клиенту
  return {
    status: 'success',
    accountData: {
      id: account.ID,
      name: account.Name,
      username: account.Username,
      email: account.Email,
      avatar: account.Avatar,
      cover: account.Cover,
      description: account.Description,
      e_balls: account.Eballs || 0,
      permissions: permissions,
      channels: channels,
      gold_status: goldStatus && goldStatus.activated || false,
      gold_history: goldHistory,
      links: links,
      messenger_notifications: messengerNotifications,
      notifications: notifications,
    }
  }
}

const logout = async (ws, data) => {
  if (!data.S_KEY) {
    return { status: 'error', message: 'S-KEY не найден' };
  }

  // Удаляем сессию из памяти
  const sessionDeleted = memoryStorage.sessions.delete(data.S_KEY);
  
  if (sessionDeleted) {
    console.log(`✅ Сессия удалена из памяти: ${data.S_KEY.substring(0, 10)}...`);
  } else {
    console.log(`ℹ️ Сессия не найдена в памяти при logout: ${data.S_KEY.substring(0, 10)}...`);
  }

  // Очищаем аккаунт в WebSocket, если он принадлежал этой сессии
  if (ws.account?.s_key === data.S_KEY) {
    ws.account = null;
    console.log(`✅ Аккаунт отвязан от WebSocket соединения`);
  }

  return { status: 'success' };
}

// Вспомогательная функция для разрешений по умолчанию
function getDefaultPermissions() {
  return {
    Posts: true,
    Comments: true,
    NewChats: true,
    MusicUpload: false,
    Admin: false,
    Verified: false,
    Fake: false
  };
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
