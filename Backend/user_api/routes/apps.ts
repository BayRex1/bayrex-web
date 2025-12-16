import { add_app, edit_app, load_app, load_apps } from "../controllers/apps/govern.js";
import { connect_app } from '../controllers/apps/user.js';

const handlers = {
    load_apps: load_apps,
    load_app: load_app,
    add_app: add_app,
    edit_app: edit_app,
    connect_app: connect_app
};

const apps = async (ws: any, action: string, data: string) => {
    if (!handlers[action]) {
        return { status: 'error', message: 'Такого действия нет' };
    }

    const result = await handlers[action]({ account: ws.account, data });
    return { action, ...result };
};

export default apps;
