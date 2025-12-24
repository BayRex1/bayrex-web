import AccountManager from '../../../../system/global/AccountManager.js';
import { connectAccount } from '../../../../system/global/AccountManager.js';
import AppError from '../../../../services/system/AppError.js';

const login = async ({ data }) => {
    try {
        console.log('🔐 Вход в аккаунт:', { 
            email: data.email?.substring(0, 10) + '...', 
            username: data.username,
            hasPassword: !!data.password 
        });
        
        // Используем новый метод connectAccount для упрощения
        const result = await connectAccount({
            email: data.email,
            username: data.username,
            password: data.password,
            device_type: data.device_type || 'browser',
            device: data.device || 'unknown'
        });
        
        console.log(`✅ Вход успешен: ${result.account.Username} (ID: ${result.account.ID})`);
        
        return {
            status: 'success',
            S_KEY: result.session.s_key,
            accountID: result.account.ID,
            username: result.account.Username,
            account: result.account,
            session: result.session,
            permissions: result.permissions
        };

    } catch (err) {
        console.error('❌ Ошибка логина:', err.message);
        
        if (err instanceof AppError) {
            return { 
                status: 'error', 
                message: err.message 
            };
        }
        
        return { 
            status: 'error', 
            message: 'Произошла ошибка при входе' 
        };
    }
};

export default login;
