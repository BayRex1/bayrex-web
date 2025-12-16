import { get_all_users, get_user } from '../controllers/users/get.js';

const handlers = {
    get_all_users: get_all_users,
    get_user: get_user
};

const users = async (ws: any, action: string, data: string) => {
    if (!handlers[action]) {
        return { status: 'error', message: 'Такого действия нет' };
    }

    const result = await handlers[action]({ app: ws.app, data });
    return { action, ...result };
};

export default users;
