import AccountManager from '../../../../../services/account/AccountManager.js';

const delete_avatar = async ({ account }) => {

    const accountManager = new AccountManager(account.ID);
    const answer = await accountManager.deleteAvatar();

    return answer;
}

export default delete_avatar;
