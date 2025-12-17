import AccountManager from '../../../../../services/account/AccountManager.js';

const upload_cover = async ({ account, data }) => {
    const { file } = data;

    const accountManager = new AccountManager(account.ID);
    const answer = await accountManager.changeCover(file);

    return answer;
}

export default upload_cover;
