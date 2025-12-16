import AppManager from '../../../services/account/AppsManager.js';

export const load_apps = async ({ account }) => {
    if (!account) return;

    const appManager = new AppManager(account.ID);
    return await appManager.loadApps();
}

export const add_app = async ({ account, data }) => {
    if (!account) return;

    const appManager = new AppManager(account.ID);
    return await appManager.addApp({
        name: data.name,
        description: data.description,
        icon: data.icon
    });
}

export const edit_app = async ({ account, data }) => {
    if (!account) return;

    const appManager = new AppManager(account.ID);
    return await appManager.editApp({
        edit: data.edit
    });
}

export const load_app = async ({ account, data }) => {
    if (!account || !data.app_id) return;

    const appManager = new AppManager(account.ID);
    return await appManager.loadApp(data.app_id);
}
