import { uuidv7 } from 'uuidv7';
import { getDate } from '../../system/global/Function.js';
import AccountDataHelper from '../account/AccountDataHelper.js';
import { dbM } from '../../lib/db.js';

class GroupManager {
    private accountID: number;

    constructor(uid: number) {
        this.accountID = uid;
    }

    async addMember(gid) {
        if (!(await this.validateGroup(gid))) return false;
        if (await this.validateMember(gid)) return false;

        await dbM.query('INSERT INTO `groups_members` (`gid`, `uid`, `join_date`) VALUES (?, ?, ?)', [gid, this.accountID, getDate()]);
        return true;
    }

    async loadMembers(gid) {
        if (!(await this.validateGroup(gid))) return false;

        const members = [];
        const membersResult = await dbM.query('SELECT * FROM `groups_members` WHERE `gid` = ?', [gid]);
        const accountDataHelper = new AccountDataHelper();

        for (const member of membersResult) {
            const author = await accountDataHelper.getAuthorData(member.uid);

            if (!author) return;

            members.push({
                id: author.id,
                name: author.name,
                username: author.username,
                avatar: author.avatar
            })
        }

        return members;
    }

    async getGroupData(gid) {
        if (!(await this.validateGroup(gid))) return {};

        const groupData = await dbM.query('SELECT * FROM `groups` WHERE `id` = ?', [gid]);

        if (groupData.length < 1) return {};

        return {
            id: groupData[0].id,
            name: groupData[0].name,
            avatar: groupData[0].avatar
        }
    }

    async joinGroup(link) {
        const linkData = await dbM.query('SELECT * FROM `groups_links` WHERE `link` = ?', [link]) 

        if (!this.validateGroup(linkData[0].gid)) return false;

        await this.addMember(linkData[0].gid);

        return true;
    }

    async getLink(gid) {
        if (!(await this.validateGroup(gid))) return false;

        const links = await dbM.query('SELECT * FROM `groups_links` WHERE `gid` = ?', [gid]);

        if (links.length < 1) return undefined;

        return links[0].link;
    }

    async generateLink(gid) {
        if (!(await this.validateGroup(gid))) return false;

        const links = await dbM.query('SELECT * FROM `groups_links` WHERE `gid` = ?', [gid])
        const link = uuidv7();

        if (links.length > 0) {
            dbM.query('DELETE FROM `groups_links` WHERE `gid` = ?', [gid]);
        }

        await dbM.query('INSERT INTO `groups_links` (`gid`, `link`, `create_date`) VALUES (?, ?, ?)', [
            gid,
            link,
            getDate()
        ])

        return link;
    }

    async isOwner(gid) {
        if (!(await this.validateGroup(gid))) return false;

        const owner = await dbM.query('SELECT * FROM `groups` WHERE `id` = ? AND `owner` = ?', [gid, this.accountID]);
        return owner.length > 0;
    }

    async validateMember(gid) {
        if (!(await this.validateGroup(gid))) return false;

        const member = await dbM.query('SELECT * FROM `groups_members` WHERE `gid` = ? AND `uid` = ?', [gid, this.accountID]);
        return member.length > 0;
    }

    async validateGroup(gid: number): Promise<boolean> {
        const group = await dbM.query('SELECT * FROM `groups` WHERE `id` = ?', [gid]);
        return group.length > 0;
    }
}


export default GroupManager;
