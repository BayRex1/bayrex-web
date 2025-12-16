import GroupManager from '../../../../services/messenger/GroupManager.js';

const joinGroup = async ({ account, data }) => {
    const groupManager = new GroupManager(account.ID);

    if (await groupManager.joinGroup(data.link)) {
        return {
            status: 'success'
        }
    } else {
        return {
            status: 'error'
        }
    }
}

export default joinGroup;
