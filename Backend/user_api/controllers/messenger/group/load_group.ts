import { dbM } from '../../../../lib/db.js';
import GroupManager from '../../../../services/messenger/GroupManager.js';

const loadGroup = async ({ account, data }) => {

    const groupManager = new GroupManager(account.ID);

    const linkData = await dbM.query('SELECT * FROM `groups_links` WHERE `link` = ?', [data.link]);

    if (!groupManager.validateGroup(linkData[0].gid)) return {
        status: 'error'
    };

    const groupData = await groupManager.getGroupData(linkData[0].gid);

    return {
        status: 'success',
        group_data: groupData
    };
}

export default loadGroup;
