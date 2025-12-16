import RouterHelper from './RouterHelper.js';

export const asyncErrorHandler = (fn: Function, timeoutMs = 30000) => {
    return async (...args: any[]) => {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
        });

        try {
            const result = await Promise.race([
                fn(...args),
                timeoutPromise
            ]);
            return result;
        } catch (error) {
            console.error('Асинхронная ошибка в контроллере:', error);
            
            if (error instanceof Error) {
                if (error.message.includes('ER_DUP_ENTRY')) {
                    return RouterHelper.error('Данные уже существуют');
                }
                if (error.message.includes('ER_NO_REFERENCED_ROW')) {
                    return RouterHelper.error('Связанные данные не найдены');
                }
                if (error.message.includes('ENOENT')) {
                    return RouterHelper.error('Файл не найден');
                }
                if (error.message.includes('EACCES')) {
                    return RouterHelper.error('Нет доступа к файлу');
                }
                if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
                    return RouterHelper.error('Слишком много открытых файлов');
                }
                if (error.message.includes('Operation timeout')) {
                    return RouterHelper.error('Операция выполняется слишком долго');
                }
            }
            
            return RouterHelper.error('Внутренняя ошибка сервера');
        }
    };
};

export const safeAsync = asyncErrorHandler;

export const withAsyncSafety = <T extends (...args: any[]) => Promise<any>>(
    fn: T
): T => {
    return asyncErrorHandler(fn) as T;
};