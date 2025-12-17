import AccountManager from '../../../../services/account/AccountManager.js';

const email = async ({ account, data }) => {
    const { email } = data;

    const accountManager = new AccountManager(account.ID);
    const answer = await accountManager.changeEmail(email);

    return answer;
}

export default email;
