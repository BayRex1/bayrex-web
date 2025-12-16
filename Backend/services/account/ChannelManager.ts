import { dbE } from '../../lib/db.js';
import Config from '../../system/global/Config.js';
import AppError from '../system/AppError.js';
import ImageEngine from '../system/ImageEngine.js';
import Validator from '../system/Validator.js';
import AccountDataHelper from './AccountDataHelper.js';

interface Channel {
  ID: number;
  Owner?: number;
  Avatar?: string;
  Cover?: string;
  Description?: string;
}

class ChannelManager {
  private channelID: number;
  private channelData: Channel | null = null;
  private initPromise: Promise<void>;

  constructor(id: number) {
    if (!id || typeof id !== 'number' || id <= 0) {
      throw new AppError('Некорректный идентификатор аккаунта');
    }
    this.channelID = id;
    this.initPromise = this.init();
  }

  private async loadChannelData(): Promise<any> {
    const accounts: Channel[] = await dbE.query('SELECT * FROM `channels` WHERE `ID` = ?', [this.channelID]);
    if (accounts.length === 0) {
      throw new AppError('Канал не найден');
    }
    this.channelData = accounts[0];
  }

  private async init(): Promise<void> {
    await this.loadChannelData();
  }

  public async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  private async withInit<T>(fn: () => Promise<T>): Promise<T> {
    await this.ensureInitialized();
    return fn();
  }

  public async getChannelData(): Promise<Channel> {
    return this.withInit(async () => {
      return this.channelData as Channel;
    });
  }

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
      const goldStatus = await AccountDataHelper.checkGoldStatus(this.channelData.Owner);

      const limit = goldStatus
        ? Config.LIMITS.GOLD.MAX_AVATAR_SIZE
        : Config.LIMITS.DEFAULT.MAX_AVATAR_SIZE;
      await validator.validateImage(avatar, limit);

      const imageEngine = new ImageEngine();
      const image = await imageEngine.create({
        path: 'avatars',
        file: avatar
      });

      if (image) {
        const query = 'UPDATE `channels` SET `Avatar` = ? WHERE `ID` = ?';
        await dbE.query(query, [JSON.stringify(image), this.channelID]);
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
      const goldStatus = await AccountDataHelper.checkGoldStatus(this.channelData.Owner);
      const limit = goldStatus
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
        const query = 'UPDATE `channels` SET `Cover` = ? WHERE `ID` = ?';
        await dbE.query(query, [JSON.stringify(image), this.channelID]);
      }

      return {
        status: 'success',
        cover: image
      };
    });
  }

  public async deleteAvatar() {
    return this.withInit(async () => {
      await dbE.query('UPDATE `channels` SET `Avatar` = null WHERE `ID` = ?', [this.channelID]);

      return {
        status: 'success'
      };
    });
  }

  public async deleteCover() {
    return this.withInit(async () => {
      await dbE.query('UPDATE `channels` SET `Cover` = null WHERE `ID` = ?', [this.channelID]);

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

      const query = 'UPDATE `channels` SET `Name` = ? WHERE `ID` = ?';
      await dbE.query(query, [name, this.channelID]);

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

      const query = 'UPDATE `channels` SET `Username` = ? WHERE `ID` = ?';
      await dbE.query(query, [username, this.channelID]);

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

      const query = 'UPDATE `channels` SET `Description` = ? WHERE `ID` = ?';
      await dbE.query(query, [description, this.channelID]);

      return {
        status: 'success'
      };
    })
  }

  static async checkOwner(accountID, channelID) {
    const channels = await dbE.query('SELECT * FROM `channels` WHERE `ID` = ? AND `Owner` = ?', [channelID, accountID]);
    return channels.length > 0;
  }
}

export default ChannelManager;
