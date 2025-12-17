import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const loadMyAppeals = async ({ account }) => {
    try {
        const appeals = await dbE.query(`
            SELECT 
                a.*,
                acc.Username as reviewer_username
            FROM appeals a
            LEFT JOIN accounts acc ON a.reviewer_id = acc.ID
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
        `, [account.ID ?? account.id]);

        const formattedAppeals = appeals.map(appeal => ({
            id: appeal.id,
            restriction_type: appeal.restriction_type,
            reason: appeal.reason,
            status: appeal.status,
            created_at: appeal.created_at,
            reviewed_at: appeal.reviewed_at,
            response: appeal.response,
            original_decision: appeal.original_decision,
            reviewer_username: appeal.reviewer_username
        }));

        return RouterHelper.success({ appeals: formattedAppeals });
    } catch (error) {
        console.error('Ошибка загрузки апелляций:', error);
        return RouterHelper.error('Ошибка загрузки апелляций');
    }
};

export default loadMyAppeals;