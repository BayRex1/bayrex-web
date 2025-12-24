import AccountManager from '../../system/global/AccountManager.js';
import LinkManager from '../../services/account/LinkManager.js';
import { dbE } from '../../lib/db.js';

const connect = async (ws, data) => {
  if (!data?.S_KEY) {
    return 'S-KEY не найден.';
  }

  // Получаем сессию напрямую из БД
  const sessionResult = await dbE.query(
    'SELECT accounts.*, accounts_sessions.* FROM `accounts_sessions` ' +
    'INNER JOIN `accounts` ON accounts.ID = accounts_sessions.uid ' +
    'WHERE accounts_sessions.s_key = ?',
    [data.S_KEY]
  );
  
  if (!sessionResult || sessionResult.length === 0) {
    return { status: 'error', message: 'S-KEY не актуален.' };
  }
  
  const session = sessionResult[0];
  
  console.log(`✅ Сессия найдена для пользователя ID: ${session.ID}, Username: ${session.Username}`);

  // Создаем AccountManager для этого пользователя
  const accountManager = new AccountManager(session.ID);
  
  if (!accountManager) {
    return { status: 'error', message: 'Аккаунт не найден.' };
  }

  // Получаем дополнительные данные
  const linkManager = new LinkManager(session.ID);
  const goldStatus = await accountManager.getGoldStatus();
  const permissions = await accountManager.getPermissions();
  const notificationsCount = await dbE.query(
    'SELECT COUNT(*) as count FROM notifications WHERE `for` = ? AND viewed = 0',
    [session.ID]
  );

  // Получаем данные аккаунта через accountManager
  const accountData = await accountManager.getAccountData();
  
  if (!accountData) {
    return { status: 'error', message: 'Данные аккаунта не получены.' };
  }

  // Устанавливаем аккаунт в WebSocket
  ws.account = { 
    ID: session.ID,
    Name: accountData.Name,
    Username: accountData.Username,
    Email: accountData.Email,
    Avatar: accountData.Avatar,
    Cover: accountData.Cover,
    Description: accountData.Description,
    Eballs: accountData.Eballs,
    permissions: permissions,
    s_key: data.S_KEY
  };

  console.log(`✅ Успешное подключение: ${accountData.Username}`);

  return {
    status: 'success',
    accountData: {
      id: session.ID,
      name: accountData.Name,
      username: accountData.Username,
      email: accountData.Email,
      avatar: accountData.Avatar,
      cover: accountData.Cover,
      description: accountData.Description,
      e_balls: accountData.Eballs,
      permissions: permissions,
      channels: await accountManager.getChannels(),
      gold_status: goldStatus?.activated || false,
      gold_history: await accountManager.getGoldHistory(),
      links: await linkManager.getLinks(),
      messenger_notifications: await accountManager.getMessengerNotifications(),
      notifications: notificationsCount[0]?.count || 0,
    }
  }
}

const logout = async (ws, data) => {
  if (!data.S_KEY) {
    return { status: 'error', message: 'S-KEY не найден' };
  }

  const session = await dbE.query('SELECT * FROM `accounts_sessions` WHERE `s_key` = ?', [data.S_KEY]);

  if (!session || session.length === 0 || !session[0].uid) {
    return { status: 'error', message: 'S-KEY не актуален' };
  };

  if (session) {
    await dbE.query('DELETE FROM `accounts_sessions` WHERE `s_key` = ?', [data.S_KEY]);
  }

  if (session[0].uid === ws.account?.ID) {
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
