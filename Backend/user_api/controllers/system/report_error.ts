import RouterHelper from '../../../services/system/RouterHelper.js';
import { telegramBot } from '../../../services/system/TelegramBot.js';

const reportError = async ({ account, data }) => {
    try {
        const { 
            message, 
            stack, 
            url, 
            userAgent, 
            componentStack
        } = data.payload || {};

        if (!message) {
            return RouterHelper.error('Сообщение об ошибке не указано');
        }

        // Формируем информацию об ошибке
        const errorInfo = {
            message: message,
            stack: stack || componentStack,
            url: url || window?.location?.href,
            userAgent: userAgent || navigator?.userAgent,
            userId: account?.ID?.toString(),
            username: account?.username || account?.Username
        };

        // Отправляем в Telegram
        await telegramBot.sendFrontendError(errorInfo);

        return RouterHelper.success({
            message: 'Ошибка отправлена в систему мониторинга'
        });

    } catch (error) {
        console.error('Ошибка при отправке ошибки в Telegram:', error);
        
        // Отправляем ошибку об ошибке :)
        await telegramBot.sendBackendError(
            error as Error, 
            'report_error controller'
        );
        
        return RouterHelper.error('Не удалось отправить ошибку в систему мониторинга');
    }
};

export default reportError; 
