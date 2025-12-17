import AccountManager from '../../../../../services/account/AccountManager.js';

const delete_cover = async ({ account }) => {

    const accountManager = new AccountManager(account.ID);
    const answer = await accountManager.deleteCover();

    return answer;
}

export default delete_cover;
