import { uuidv7 } from 'uuidv7';
import { getDate } from '../../system/global/Function.js';
import FoxToken from '../system/FoxToken.js';
import Validator from '../system/Validator.js';
import AccountManager from './AccountManager.js';
import Config from '../../system/global/Config.js';
import FileManager from '../system/FileManager.js';
import { dbA } from '../../lib/db.js';

interface AppInfo {
    icon: string;
    name: string;
    description: string;
}

class AppManager {
    private accountManager: AccountManager;
    private initPromise: Promise<void>;
    private accountData?: any;

    constructor(uid: number) {
        this.accountManager = new AccountManager(uid);
        this.initPromise = this.init();
    }

    private async init(): Promise<void> {
        this.accountData = await this.accountManager.getAccountData();
    }

    public async ensureInitialized(): Promise<void> {
        await this.initPromise;
    }

    public async loadApps(): Promise<object> {
        await this.ensureInitialized();

        const rows = await dbA.query('SELECT * FROM `apps` WHERE `owner` = ? ORDER BY `create_date` DESC', [this.accountData.ID]);

        const apps = await Promise.all(rows.map(async (app: any) => {
            return {
                id: app.id,
                name: app.name,
                description: app.description,
                icon: await this.getIcon(app.icon),
                url: app.url,
                api_key: app.api_key,
                create_date: app.create_date
            };
        }));

        return {
            status: 'success',
            apps: apps
        }
    }

    public async loadApp(id: string): Promise<object> {
        await this.ensureInitialized();

        if (!id) {
            return { status: 'error', message: 'Не указан идентификатор приложения' };
        }

        const row = await dbA.query('SELECT * FROM `apps` WHERE `id` = ?', [id]);

        if (!row.length) {
            return { status: 'error', message: 'Приложение не найдено' };
        }

        return {
            status:'success',
            app: {
                id: row[0].id,
                name: row[0].name,
                description: row[0].description,
                icon: await this.getIcon(row[0].icon),
                url: row[0].url,
                create_date: row[0].create_date
            }
        }
    }

    public async connectApp(uid, appID: string): Promise<object> {
        await this.ensureInitialized();

        const app = await dbA.query('SELECT * FROM `apps` WHERE `id` = ?', [appID]);
        const secretID = uuidv7();

        if (!app.length) {
            return { status: 'error', message: 'Приложение не найдено' };
        }

        const connect = await dbA.query('SELECT * FROM `connects` WHERE `uid` = ? AND `app_id` = ?', [this.accountData.ID, app[0].id]);
        if (connect.length < 1) {
            await dbA.query('INSERT INTO `connects` (`uid`, `app_id`, `secret_id`, `date`) VALUES (?, ?, ?, ?)', [this.accountData.ID, app[0].id, secretID, getDate()]);
        }

        return { 
            status: 'success', 
            message: 'Приложение успешно подключено',
            connect_key: await FoxToken.generateToken(String(uid), (connect[0] && connect[0].secret_id) ? connect[0].secret_id : secretID)
        };
    }

    public async addApp({ icon, name, description }: AppInfo): Promise<object> {
        await this.ensureInitialized();
        const validator = new Validator();

        const bufferIcon = icon ? Buffer.from(icon.replace(/^data:image\/\w+;base64,/, ''), 'base64') : null;

        try {
            validator.validateText({
                title: 'Имя приложения',
                value: name,
                maxLength: 50
            });
            validator.validateText({
                title: 'Описание приложения',
                value: description,
                maxLength: 150
            });
            if (bufferIcon) await validator.validateImage(bufferIcon, Config.LIMITS.MAX_APP_ICON_SIZE);
        } catch (error) {
            return { status: 'error', message: error.message };
        }

        const appID = await this.generateAppID();
        const secretID = uuidv7();

        await dbA.query('INSERT INTO `apps` (`id`, `name`, `owner`, `description`, `secret_id`, `api_key`, `create_date`) VALUES (?, ?, ?, ?, ?, ?, ?)', [
            appID,
            name,
            this.accountData.ID,
            description,
            secretID,
            await FoxToken.generateToken(appID, secretID),
            getDate()
        ]);

        if (bufferIcon) {
            const fileName = await FileManager.saveFile('apps/icons', bufferIcon);
            await dbA.query('UPDATE `apps` SET `icon` = ? WHERE `id` = ? AND `owner` = ?', [fileName, appID, this.accountData.ID]);
        }

        return { status: 'success', message: 'Приложение добавлено успешно' };
    }

    public async editApp({ edit }): Promise<object> {
        await this.ensureInitialized();
        const validator = new Validator();

        const icon = edit.icon ? Buffer.from(edit.icon.replace(/^data:image\/\w+;base64,/, ''), 'base64') : null;

        try {
            if (edit.name) {
                validator.validateText({
                    title: 'Имя приложения',
                    value: edit.name,
                    maxLength: 50
                });
            }
            if (edit.description) {
                validator.validateText({
                    title: 'Описание приложения',
                    value: edit.description,
                    maxLength: 150
                });
            }
            if (edit.url) {
                validator.validateText({
                    title: 'Ссылка',
                    value: edit.url,
                    maxLength: 350
                });
            }
            if (icon) await validator.validateImage(icon, Config.LIMITS.MAX_APP_ICON_SIZE);
        } catch (error) {
            return { status: 'error', message: error.message };
        }

        if (icon) {
            const appData = await dbA.query('SELECT * FROM `apps` WHERE `id` = ? AND `owner`', [edit.app_id, this.accountData.ID])
            if (appData[0] && appData[0].icon) {
                await this.deleteIcon(appData[0].icon);
            }
            const fileName = await FileManager.saveFile('apps/icons', icon);
            await dbA.query('UPDATE `apps` SET `icon` = ? WHERE `id` = ? AND `owner` = ?', [fileName, edit.app_id, this.accountData.ID]);
        }
        if (edit.name) {
            await dbA.query('UPDATE `apps` SET `name` = ? WHERE `id` = ? AND `owner` = ?', [edit.name, edit.app_id, this.accountData.ID]);
        }
        if (edit.description) {
            await dbA.query('UPDATE `apps` SET `description` = ? WHERE `id` = ? AND `owner` = ?', [edit.description, edit.app_id, this.accountData.ID]);
        }
        if (edit.url) {
            await dbA.query('UPDATE `apps` SET `url` = ? WHERE `id` = ? AND `owner` = ?', [edit.url, edit.app_id, this.accountData.ID]);
        }

        return {
            status: 'success',
            message: 'Изменения сохранены успешно'
        }
    }

    async getIcon(icon: string): Promise<string> {
        if (!icon) return null;
        const { buffer, ext }: any = await FileManager.getFromStorage(`apps/icons/${icon}`);
        return `data:image/${ext};base64,${buffer.toString('base64')}`;
    }

    async deleteIcon(icon: string) {
        const apps = await dbA.query('SELECT * FROM `apps` WHERE `icon` = ?', [icon]);
        if (apps.length < 2) {
            await FileManager.deleteFromStorage(`apps/icons/${icon}`);
        }
    }

    public async generateAppID(): Promise<string> {
        while (true) {
            const id = uuidv7();
            const rows = await dbA.query('SELECT * FROM `apps` WHERE `id` = ?', [id]);
            if (rows.length === 0) return id;
        }
    }
}

export default AppManager;