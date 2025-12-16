import authorization from './routes/authorization.js';
import users from './routes/users.js';

interface Router {
    ws: any,
    type: string,
    action: string,
    data: any,
}

const router = async ({ ws, type, action, data }: Router): Promise<any> => {
    try {
        switch (type) {
            case 'ping':
                return { type: 'ping' };
            case 'authorization': {
                const authAnswer: any = await authorization(ws, action, data);
                return { type: 'authorization', ...authAnswer };
            }
            case 'users':
                const usersAnswer: any = await users(ws, action, data);
                return { type: 'users',...usersAnswer };
            default: {
                return { type: 'error', text: 'Тип запроса не найден.' };
            }
        }
    } catch (error) {
        console.error('Ошибка роутинга пользователя:', error);
        return { status: 'error', message: 'Произошла ошибка при обработке запроса.' };
    }
};

export default router;
