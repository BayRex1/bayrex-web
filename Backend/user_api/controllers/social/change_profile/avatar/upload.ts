import AccountManager from '../../../../../services/account/AccountManager.js';

const upload_avatar = async ({ account, data }) => {
    const { file } = data;

    const accountManager = new AccountManager(account.ID);
    const answer = await accountManager.changeAvatar(file);

    return answer;
}

export default upload_avatar;
