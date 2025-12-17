import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const checkExisting = async ({ account, data }) => {
    const { restriction_type } = data.payload;

    if (!restriction_type) {
        return RouterHelper.error('Не указан тип ограничения');
    }

    const validRestrictionTypes = ['posts', 'comments', 'chat', 'music'];
    if (!validRestrictionTypes.includes(restriction_type)) {
        return RouterHelper.error('Неверный тип ограничения');
    }

    try {
        const latestPunishment = await dbE.query(`
            SELECT * FROM accounts_punishments 
            WHERE user_id = ? 
            AND punishment_type = ? 
            AND is_active = 1
            ORDER BY created_at DESC 
            LIMIT 1
        `, [account.ID, `restrict_${restriction_type}`]);

        if (latestPunishment.length > 0) {
            const existingAppeals = await dbE.query(
                'SELECT id FROM appeals WHERE user_id = ? AND restriction_type = ? AND report_id = ? AND status IN (?, ?)',
                [account.ID, restriction_type, latestPunishment[0].report_id || 0, 'pending', 'under_review']
            );

            if (existingAppeals.length > 0) {
                return RouterHelper.error('APPEAL_EXISTS');
            }
        } else {
            const existingAppeals = await dbE.query(
                'SELECT id FROM appeals WHERE user_id = ? AND restriction_type = ? AND report_id = 0 AND status IN (?, ?)',
                [account.ID, restriction_type, 'pending', 'under_review']
            );

            if (existingAppeals.length > 0) {
                return RouterHelper.error('APPEAL_EXISTS');
            }
        }

        return RouterHelper.success('OK');
    } catch (error) {
        console.error('Ошибка проверки существующих апелляций:', error);
        return RouterHelper.error('Ошибка проверки существующих апелляций');
    }
};

export default checkExisting;