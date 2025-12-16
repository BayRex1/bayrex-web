import AppSessionManager from '../../../system/global/AppSessionManager.js';

export const connect = async (ws: any, data: any) => {
    const app = await AppSessionManager.connectAccount({
        api_key: data.api_key,
        ws: ws
    });

    if (!app) {
        return { status: 'error', message: 'Ошибка подключения, возможно неверный ключ' }
    }

    ws.app = app;
    
    const { api_key, secret_id, ...filteredApp } = app;

    return {
        status: 'success',
        appData: filteredApp
    };
}
