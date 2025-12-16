import { connect } from '../controllers/authorization/connect.js';

const handlers = {
    connect: connect
};

const authorization = async (ws: any, action: string, data: string) => {
    if (!handlers[action]) {
        return { status: 'error', message: 'Такого действия нет' };
    }

    const result = await handlers[action](ws, data);
    return { action, ...result };
};

export default authorization;
