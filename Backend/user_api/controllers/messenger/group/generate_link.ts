import GroupManager from '../../../../services/messenger/GroupManager.js';

const generateGroupLink = async ({ account, data }) => {
    const groupManager = new GroupManager(account.ID);
    
    if (!await groupManager.isOwner(data.gid)) return {
        status: 'error'
    }

    const newLink = await groupManager.generateLink(data.gid);

    return {
        status: 'success',
        link: newLink
    }
}

export default generateGroupLink;
