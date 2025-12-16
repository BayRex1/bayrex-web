import GroupManager from '../../../../services/messenger/GroupManager.js';

const loadGroupMembers = async ({ account, data }) => {

    if (!data.gid) return {
        status: 'error'
    }

    const groupManager = new GroupManager(account.ID);

    if (! (await groupManager.validateMember(data.gid))) return {
        status: 'error'
    }
    
    const members = await groupManager.loadMembers(data.gid);

    if (!members) return {
        status: 'error'
    }

    return {
        status: 'success',
        members: members
    }
}

export default loadGroupMembers;
