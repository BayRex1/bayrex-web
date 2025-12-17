import AccountManager from '../../../../services/account/AccountManager.js';

const name = async ({ account, data }) => {
    const { name } = data;

    const accountManager = new AccountManager(account.ID);
    const answer = await accountManager.changeName(name);

    return answer;
}

export default name;