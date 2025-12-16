import { dbE } from '../../lib/db.js';
import { getDate } from '../../system/global/Function.js';
import AccountManager from './AccountManager.js';

class LinkManager {
    constructor(uid) {
        this.accountManager = new AccountManager(uid);
        this.errors = [];
        this.initPromise = this.init();
    }

    async init() {
        this.accountData = await this.accountManager.getAccountData();
    }

    async ensureInitialized() {
        await this.initPromise;
    }

    async getLinks() {
        await this.ensureInitialized();
        const query = 'SELECT * FROM `accounts_links` WHERE `UserID` = ? ORDER BY `Date` DESC';
        const rows = await dbE.query(query, [this.accountData.ID]);
        const links = rows.map(link => ({
            id: link.ID,
            title: link.Title,
            url: link.Link
        }));

        return links;
    }

    async addLink(title, link) {
        await this.ensureInitialized();
        const errors = this.validateLink(title, link);
        if (errors.length > 0) {
            return { status: 'error', message: errors[0] };
        }

        const query = `INSERT INTO accounts_links (UserID, Title, Link, Date) VALUES (?, ?, ?, ?)`;
        const result = await dbE.query(query, [this.accountData.ID, title.trim(), link.trim(), getDate()]);

        await this.recountLinks();

        return { status: 'success', link_id: result.insertId };
    }

    async editLink(linkID, title, link) {
        await this.ensureInitialized();
        const errors = this.validateLink(title, link);
        if (errors.length > 0) {
            return { status: 'error', message: errors[0] };
        }

        if (await this.isOwner(linkID)) {
            const query = 'UPDATE `accounts_links` SET `Title` = ?, `Link` = ? WHERE `ID` = ?';
            await dbE.query(query, [title, link, linkID]);
            return { status: 'success' };
        } else {
            return { status: 'error', message: 'Вы не владелец ссылки' };
        }
    }

    async deleteLink(linkID) {
        await this.ensureInitialized();
        if (await this.isOwner(linkID)) {
            const query = 'DELETE FROM `accounts_links` WHERE `ID` = ?';
            await dbE.query(query, [linkID]);
            return { status: 'success' };
        } else {
            return { status: 'error', message: 'Вы не владелец ссылки' };
        }
    }

    async isOwner(linkID) {
        const query = 'SELECT * FROM `accounts_links` WHERE `ID` = ? AND `UserID` = ?';
        const rows = await dbE.query(query, [linkID, this.accountData.ID]);
        if (rows.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    validateLink(title, link) {
        let errors = [];

        if (!title || !link) {
            errors.push('Заполните все поля');
        }
        if (title.length > 50) {
            errors.push('Имя ссылки слишком длинное');
        }
        if (link.length > 150) {
            errors.push('Ссылка слишком длинная');
        }
        if (!/^https?:\/\//i.test(link)) {
            errors.push('Текст не является ссылкой');
        }
        if (this.accountData.Links > 49) {
            errors.push('Нельзя добавить больше 50-ти ссылок');
        }

        return errors;
    }

    async recountLinks() {
        await this.ensureInitialized();
        const query = `UPDATE accounts SET Links = (SELECT COUNT(*) FROM accounts_links WHERE UserID = ?) WHERE ID = ?`;
        await dbE.query(query, [this.accountData.ID, this.accountData.ID]);
    }
}

export default LinkManager;
