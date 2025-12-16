import messenger from './routes/messenger.js';
import authorization from './routes/authorization.js';
import social from './routes/social.js';
import system from './routes/system.js';
import download from './routes/download.js';
import apps from './routes/apps.js';

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
            case 'messenger': {
                const messengerAnswer = await messenger(ws, action, data);
                return { type: 'messenger', ...messengerAnswer };
            }
            case 'social': {
                const socialAnswer = await social(ws, action, data);
                return { type: 'social', ...socialAnswer };
            }
            case 'apps': {
                const socialAnswer = await apps(ws, action, data);
                return { type: 'apps', ...socialAnswer };
            }
            case 'system': {
                const systemAnswer = await system(ws, action, data);
                return { type: 'system', ...systemAnswer };
            }
            case 'download': {
                const downloadAnswer = await download(ws, action, data);
                return { type: 'download',...downloadAnswer };
            }
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