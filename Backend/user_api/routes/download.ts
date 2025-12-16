import AppError from '../../services/system/AppError.js';
import image from '../controllers/download/image.js';
import music from '../controllers/download/music.js';
import file from '../controllers/download/file.js';

const routes = {
    music: { h: music, useAccount: true },
    image: { h: image, useAccount: false },
    file: { h: file, useAccount: false }
};

const flatRoutes = new Map();

const flattenRoutes = (obj, path = '') => {
    for (const key in obj) {
        const val = obj[key];
        const fullPath = path ? `${path}/${key}` : key;

        if (val && typeof val.h === 'function') {
            flatRoutes.set(fullPath, val);
        } else if (typeof val === 'object' && val !== null) {
            flattenRoutes(val, fullPath);
        }
    }
};

flattenRoutes(routes);

const download = async (ws, action, data) => {
    try {
        const route = flatRoutes.get(action);
        
        if (!route) {
            return { status: 'error', message: 'Такого действия нет' };
        }

        if (route.useAccount && !ws?.account?.ID) {
            return { status: 'error', message: 'Вы не вошли в аккаунт' };
        }

        const result = await route.h({ account: ws.account, data });

        return { action, ...result };
    } catch (error) {
        console.error('Ошибка в download:', error);

        if (error instanceof AppError) {
            return { status: 'error', message: error.message };
        }

        return {
            status: 'error',
            message: 'Внутренняя ошибка сервера'
        };
    }
};

export default download;
