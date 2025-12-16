
import AppManager from "../../../services/account/AppsManager.js";

export const connect_app = async ({ account, data }) => {
    if (!account || !data.app_id) return;

    const appManager = new AppManager(account.ID);
    return await appManager.connectApp(account.ID, data.app_id);
}
