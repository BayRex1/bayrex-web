import AccountManager from '../../../../services/account/AccountManager.js';

const username = async ({ account, data }) => {
    const { username } = data;

    const accountManager = new AccountManager(account.ID);
    const answer = await accountManager.changeUsername(username);

    return answer;
}

export default username;