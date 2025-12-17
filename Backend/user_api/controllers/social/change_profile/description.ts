import AccountManager from '../../../../services/account/AccountManager.js';

const description = async ({ account, data }) => {
    const { description } = data;

    const accountManager = new AccountManager(account.ID);
    const answer = await accountManager.changeDescription(description);

    return answer;
}

export default description;