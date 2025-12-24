import { getSession, setWsToSession } from '../../system/global/AccountManager.js';
import AccountManager from '../../services/account/AccountManager.js';
import LinkManager from '../../services/account/LinkManager.js';
import { dbE } from '../../lib/db.js';

const connect = async (ws, data) => {
  if (!data?.S_KEY) {
    return 'S-KEY не найден.';
  }

  // Используем getSession вместо connectAccount
  const session = await getSession(data.S_KEY);

  if (!session || !session.ID) {
    return { status: 'error', message: 'S-KEY не актуален.' };
  }

  console.log(`✅ Сессия найдена для пользователя ID: ${session.ID}`);

  // Обновляем WebSocket в сессии
  try {
    await setWsToSession(data.S_KEY, ws);
  } catch (error) {
    console.log(`⚠️ Не удалось обновить WebSocket в сессии: ${error.message}`);
  }

  // Получаем данные аккаунта
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

  // Получаем базовые данные аккаунта
  const accountData = await accountManager.account();
  
  if (!accountData) {
    return { status: 'error', message: 'Данные аккаунта не получены.' };
  }

  // Устанавливаем аккаунт в WebSocket
  ws.account = { 
    ID: session.ID,
    ...accountData, 
    permissions: permissions 
  };

  console.log(`✅ Успешное подключение: ${accountData.Username || session.Username}`);

  return {
    status: 'success',
    accountData: {
      id: session.ID,
      name: accountData.Name || session.Name,
      username: accountData.Username || session.Username,
      email: accountData.Email || session.Email,
      avatar: accountData.Avatar || session.Avatar,
      cover: accountData.Cover || session.Cover,
      description: accountData.Description || session.Description,
      e_balls: accountData.Eballs || session.Eballs || 0,
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
