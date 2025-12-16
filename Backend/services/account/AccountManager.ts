import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Config from '../../system/global/Config.js';
import AppError from '../system/AppError.js';
import ImageEngine from '../system/ImageEngine.js';
import Validator from '../system/Validator.js';
import { getDate } from '../../system/global/Function.js';
import { dbE, dbM } from '../../lib/db.js';

interface Account {
  ID: number;
  Email: string;
  Password: string;
  Avatar?: string;
  Links?: any;
}

interface Channel {
  ID: number;
  Name: string;
  Username: string;
  Avatar: string;
  Cover: string;
  Description: string;
  Subscribers: number;
  Posts: number;
  CreateDate: string;
}

interface Permissions {
  Posts: boolean;
  Comments: boolean;
  NewChats: boolean;
  MusicUpload: boolean;
  Admin: boolean;
  Verified: boolean;
  Fake: boolean;
}

interface GoldHistoryItem {
  status: number;
  date: string;
}

class AccountManager {
  private accountID: number;
  private accountData: Account | null = null;
  private initPromise: Promise<void>;

  constructor(id: number) {
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new AppError('Некорректный идентификатор аккаунта');
    }
    this.accountID = id;
    this.initPromise = this.init();
  }

  // Загрузка данных аккаунта из БД
  private async loadAccountData(): Promise<any> {
    const accounts: Account[] = await dbE.query('SELECT * FROM `accounts` WHERE `ID` = ?', [this.accountID]);
    if (accounts.length === 0) {
      throw new AppError('Аккаунт не найден');
    }
    this.accountData = accounts[0];
  }

  // Инициализация: загрузка данных аккаунта
  private async init(): Promise<void> {
    await this.loadAccountData();
  }

  // Метод для ожидания окончания инициализации
  public async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  // Метод-обёртка для методов, которым необходимы данные аккаунта
  private async withInit<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureInitialized();
    return fn();
  }

  // Метод для получения данных аккаунта
  public async getAccountData(): Promise<Account> {
    return this.withInit(async () => {
      return this.accountData as Account;
    });
  }

  // Получение истории активации Gold
  public async getGoldHistory(): Promise<GoldHistoryItem[]> {
    return this.withInit(async () => {
      const query = 'SELECT * FROM `gold_subs` WHERE `uid` = ? ORDER BY `date` DESC';
      const activationHistory = await dbE.query(query, [this.accountID]);

      return activationHistory.map((row: any) => ({
        status: row.status,
        date: row.date
      }));
    });
  }

  // Получение текущего статуса Gold
  public async getGoldStatus(): Promise<{ activated: boolean; date_get: string | null } | false> {
    return this.withInit(async () => {
      const gold = await dbE.query("SELECT * FROM `gold_subs` WHERE `uid` = ? AND `status` = 1 LIMIT 1", [this.accountID]);
      if (!gold || gold.length === 0) return false;
      return {
        activated: true,
        date_get: gold[0].Date ?? null
      };
    });
  }

  public async addEballs(count) {
    return this.withInit(async () => {
      await dbE.query(`
        UPDATE accounts
        SET Eballs = ROUND(Eballs + ?, 3)
        WHERE id = ?
    `, [count, this.accountID]);
    });
  }

  public async maybeReward(type: 'post' | 'comment' | 'song') {
    return this.withInit(async () => {
      const TYPE_UPPER = type.toUpperCase();
      const CONFIG = Config.EBALLS[TYPE_UPPER];
      if (!CONFIG) return;

      const LAST_KEY = `last_${type}`;
      const LAST_TIME_RAW = this.accountData[LAST_KEY];
      if (!LAST_TIME_RAW) {
        await dbE.query(`UPDATE accounts SET ${LAST_KEY} = ? WHERE ID = ?`, [getDate(), this.accountID]);
      }
      const LAST_TIME = typeof LAST_TIME_RAW === 'string' ? new Date(LAST_TIME_RAW).getTime() : LAST_TIME_RAW;
      const NOW = Date.now();

      if (typeof LAST_TIME !== 'number' || NOW - LAST_TIME >= CONFIG.COOLDOWN_MS) {
        await this.addEballs(CONFIG.AMOUNT);
        this.accountData[LAST_KEY] = NOW;
        await dbE.query(`UPDATE accounts SET ${LAST_KEY} = ? WHERE ID = ?`, [getDate(), this.accountID]);
      }
    });
  }

  // Получение разрешений пользователя
  public async getPermissions(): Promise<Permissions | false> {
    return this.withInit(async () => {
      let permissions = await dbE.query("SELECT * FROM `accounts_permissions` WHERE `UserID` = ?", [this.accountID]);
      if (permissions.length < 1) {
        await dbE.query("INSERT INTO `accounts_permissions` (`UserID`) VALUES (?)", [this.accountID]);
        permissions = await dbE.query("SELECT * FROM `accounts_permissions` WHERE `UserID` = ?", [this.accountID]);
      }
      if (permissions.length < 1) return false;

      const userPermissions = { ...permissions[0] };
      delete userPermissions.ID;
      delete userPermissions.UserID;

      Object.keys(userPermissions).forEach((key) => {
        userPermissions[key] = userPermissions[key] == 1;
      });

      return userPermissions;
    });
  }

  // Получение списка каналов аккаунта
  public async getChannels(): Promise<Channel[]> {
    return this.withInit(async () => {
      const channels: any = await dbE.query("SELECT * FROM `channels` WHERE `Owner` = ?", [this.accountID]);

      return channels.map((channel: any) => ({
        id: channel.ID,
        name: channel.Name,
        username: channel.Username,
        avatar: channel.Avatar,
        cover: channel.Cover,
        description: channel.Description,
        subscribers: channel.Subscribers,
        posts: channel.Posts,
        create_date: channel.CreateDate
      }));
    });
  }

  // Получение количества уведомлений в мессенджере
  public async getMessengerNotifications(): Promise<number> {
    return this.withInit(async () => {
      const notifications = await dbM.query('SELECT * FROM `notifications` WHERE `uid` = ?', [this.accountID]);
      return notifications.length;
    });
  }

  // Смена аватара пользователя
  public async changeAvatar(avatar: any): Promise<{ status: string; avatar?: any; error?: string; message?: string }> {
    return this.withInit(async () => {
      if (avatar === undefined) {
        return {
          status: 'error',
          error: 'avatar_empty',
          message: 'Аватар не был передан'
        };
      }

      const validator = new Validator();
      const goldStatus = await this.getGoldStatus();

      const limit = (goldStatus && goldStatus.activated)
        ? Config.LIMITS.GOLD.MAX_AVATAR_SIZE
        : Config.LIMITS.DEFAULT.MAX_AVATAR_SIZE;
      await validator.validateImage(avatar, limit);

      const imageEngine = new ImageEngine();
      const image = await imageEngine.create({
        path: 'avatars',
        file: avatar
      });

      if (image) {
        const query = 'UPDATE `accounts` SET `Avatar` = ? WHERE `ID` = ?';
        await dbE.query(query, [JSON.stringify(image), this.accountID]);
      }

      return {
        status: 'success',
        avatar: image
      };
    });
  }

  public async changeCover(cover: any) {
    return this.withInit(async () => {
      if (cover === undefined) {
        return {
          status: 'error',
          error: 'cover_empty',
          message: 'Обложка не была передана'
        };
      }

      const validator = new Validator();
      const goldStatus = await this.getGoldStatus();
      const limit = (goldStatus && goldStatus.activated)
        ? Config.LIMITS.GOLD.MAX_COVER_SIZE
        : Config.LIMITS.DEFAULT.MAX_COVER_SIZE;
      await validator.validateImage(cover, limit);

      const imageEngine = new ImageEngine();
      const image = await imageEngine.create({
        path: 'covers',
        file: cover,
        simpleSize: 600
      });

      if (image) {
        const query = 'UPDATE `accounts` SET `Cover` = ? WHERE `ID` = ?';
        await dbE.query(query, [JSON.stringify(image), this.accountID]);
      }

      return {
        status: 'success',
        cover: image
      };
    });
  }

  public async deleteAvatar() {
    return this.withInit(async () => {
      await dbE.query('UPDATE `accounts` SET `Avatar` = null WHERE `ID` = ?', [this.accountID]);

      return {
        status: 'success'
      };
    });
  }

  public async deleteCover() {
    return this.withInit(async () => {
      await dbE.query('UPDATE `accounts` SET `Cover` = null WHERE `ID` = ?', [this.accountID]);

      return {
        status: 'success'
      };
    });
  }

  public async changeName(name: string): Promise<any> {
    return this.withInit(async () => {
      if (name === undefined) {
        return {
          status: 'error',
          error: 'name_empty',
          message: 'Имя не было передано'
        };
      }

      const validator = new Validator();

      validator.validateText({
        title: 'Имя',
        value: name,
        maxLength: 60
      })

      const query = 'UPDATE `accounts` SET `Name` = ? WHERE `ID` = ?';
      await dbE.query(query, [name, this.accountID]);

      return {
        status: 'success'
      };
    })
  }

  public async changeUsername(username: string): Promise<any> {
    return this.withInit(async () => {
      if (username === undefined) {
        return {
          status: 'error',
          error: 'username_empty',
          message: 'Уникальное имя не было передано'
        };
      }

      const validator = new Validator();
      validator.validateText({
        title: 'Уникальное имя',
        value: username,
        maxLength: 60
      })
      await validator.validateUsername(username);

      const query = 'UPDATE `accounts` SET `Username` = ? WHERE `ID` = ?';
      await dbE.query(query, [username, this.accountID]);

      return {
        status: 'success'
      };
    })
  }

  public async changeDescription(description: string): Promise<any> {
    return this.withInit(async () => {
      if (description === undefined) {
        return {
          status: 'error',
          error: 'description_empty',
          message: 'Описание не было передано'
        };
      }

      const validator = new Validator();
      validator.validateText({
        title: 'Описание',
        value: description,
        maxLength: 1000
      })

      const query = 'UPDATE `accounts` SET `Description` = ? WHERE `ID` = ?';
      await dbE.query(query, [description, this.accountID]);

      return {
        status: 'success'
      };
    })
  }

  public async changeEmail(email: string): Promise<any> {
    return this.withInit(async () => {
      if (email === undefined) {
        return {
          status: 'error',
          error: 'email_empty',
          message: 'Почта не была передана'
        };
      }

      const validator = new Validator();
      await validator.validateEmail(email, true);

      const query = 'UPDATE `accounts` SET `Email` = ? WHERE `ID` = ?';
      await dbE.query(query, [email, this.accountID]);

      return {
        status: 'success'
      };
    })
  }

  public async changePassword(password: string): Promise<any> {
    return this.withInit(async () => {
      if (password === undefined) {
        return {
          status: 'error',
          error: 'password_empty',
          message: 'Пароль не был передан'
        };
      }

      const validator = new Validator();

      validator.validateText({
        title: 'Пароль',
        value: password,
        maxLength: 100
      })

      const hash = await bcrypt.hash(password, 10);

      const query = 'UPDATE `accounts` SET `Password` = ? WHERE `ID` = ?';
      await dbE.query(query, [hash, this.accountID]);

      return {
        status: 'success'
      };
    })
  }

  // Блокировка профиля (например, блокировка пользователя или канала)
  public async blockProfile(authorID: number, authorType: number): Promise<void> {
    return this.withInit(async () => {
      if (authorID === undefined || authorType === undefined) {
        throw new AppError('Некорректные данные поста: отсутствует TargetID или TargetType');
      }

      if (authorType === 1) {
        const channelOwner = await this.getChannelOwner(authorID);
        if (channelOwner === this.accountID) {
          throw new AppError('Нельзя заблокировать свой же канал');
        }
      }

      if (this.accountID === authorID) {
        throw new AppError('Нельзя заблокировать самого себя');
      }

      const blockedUsers = await dbE.query('SELECT * FROM `blocked` WHERE `uid` = ?', [this.accountID]);
      if (blockedUsers.length >= Config.LIMITS.MAX_BLOCKED_USERS) {
        throw new AppError('Превышен лимит заблокированных пользователей');
      }

      const blocked = await dbE.query(
        'SELECT * FROM `blocked` WHERE `uid` = ? AND `author_id` = ? AND `author_type` = ?',
        [this.accountID, authorID, authorType]
      );

      if (blocked.length > 0) {
        throw new AppError('Пользователь уже заблокирован');
      }

      await dbE.query(
        'INSERT INTO `blocked` (`uid`, `author_id`, `author_type`) VALUES (?, ?, ?)',
        [this.accountID, authorID, authorType]
      );
    });
  }

  // Разблокировка профиля
  public async unblockProfile(authorID: number, authorType: number): Promise<void> {
    return this.withInit(async () => {
      if (authorID === undefined || authorType === undefined) {
        throw new AppError('Некорректные данные поста: отсутствует TargetID или TargetType');
      }

      const blocked = await dbE.query(
        'SELECT * FROM `blocked` WHERE `uid` = ? AND `author_id` = ? AND `author_type` = ?',
        [this.accountID, authorID, authorType]
      );
      if (blocked.length < 1) {
        throw new AppError('Пользователь не заблокирован');
      }

      await dbE.query(
        'DELETE FROM `blocked` WHERE `uid` = ? AND `author_id` = ? AND `author_type` = ?',
        [this.accountID, authorID, authorType]
      );
    });
  }

  // Получение владельца канала по его идентификатору
  public async getChannelOwner(channelID: number): Promise<number> {
    return this.withInit(async () => {
      const channels = await dbE.query('SELECT * FROM `channels` WHERE `ID` = ?', [channelID]);
      if (channels.length === 0) {
        throw new AppError('Канал не найден');
      }
      return channels[0].Owner;
    });
  }

  public async startSession(deviceType: string, device: string | null): Promise<string> {
    return this.withInit(async () => {

      const deviceTypeMap: Record<string, number> = {
        browser: 1,
        android_app: 2,
        ios_app: 3,
        windows_app: 4
      };

      const typeCode = deviceTypeMap[deviceType] ?? 0;
      const deviceName = typeof device === 'string' && device.length <= 100 ? device : 'неизвестно';

      let S_KEY: string;
      let isUnique = false;

      const maxIterations = 10;
      let iterations = 0;

      do {
        if (iterations++ >= maxIterations) {
          throw new AppError('Не удалось сгенерировать уникальный ключ сессии');
        }

        S_KEY = crypto.randomBytes(32).toString('hex');
        const result = await dbE.query(
          'SELECT COUNT(*) AS count FROM `accounts_sessions` WHERE `s_key` = ?',
          [S_KEY]
        );

        isUnique = result[0]?.count === 0;
      } while (!isUnique);

      await dbE.query(
        'INSERT INTO `accounts_sessions` (`uid`, `s_key`, `device_type`, `device`, `create_date`) VALUES (?, ?, ?, ?, ?)',
        [this.accountID, S_KEY, typeCode, deviceName, getDate()]
      );

      return S_KEY;
    });
  }

  public async verifyPassword(password: string): Promise<boolean> {
    return this.withInit(async () => {
      if (!this.accountData) {
        throw new AppError('Данные аккаунта не загружены');
      }

      const storedHash = this.accountData.Password;
      const hash1 = crypto.createHash('md5').update(password + 'z0vY_Pid0d0r!_1%@#2').digest('hex');
      const hash2 = crypto.createHash('md5').update(password + 'ZZZQuErT-s72hwsAdw334Axccvr').digest('hex');

      if (hash1 === storedHash || hash2 === storedHash) {
        return true;
      }

      if (await bcrypt.compare(password, storedHash)) {
        return true;
      }

      return false;
    });
  }
}

export default AccountManager;
