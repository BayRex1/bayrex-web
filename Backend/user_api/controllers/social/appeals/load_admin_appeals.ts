import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const loadAdminAppeals = async ({ data }) => {
    try {
        const { status = 'all', limit = 50, offset = 0 } = data.payload || {};

        let whereClause = '';
        let params = [];

        if (status !== 'all') {
            whereClause = 'WHERE a.status = ?';
            params.push(status);
        }

        const appeals = await dbE.query(`
            SELECT 
                a.*,
                acc.Username as user_username,
                acc.Name as user_name,
                acc.Avatar as user_avatar,
                reviewer.Username as reviewer_username,
                ap.reason as original_punishment_reason,
                ap.created_at as punishment_date
            FROM appeals a
            LEFT JOIN accounts acc ON a.user_id = acc.ID
            LEFT JOIN accounts reviewer ON a.reviewer_id = reviewer.ID
            LEFT JOIN accounts_punishments ap ON a.report_id = ap.report_id AND ap.user_id = a.user_id
            ${whereClause}
            ORDER BY 
                CASE 
                    WHEN a.status = 'pending' THEN 1
                    WHEN a.status = 'under_review' THEN 2
                    ELSE 3
                END,
                a.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const totalCount = await dbE.query(`
            SELECT COUNT(*) as count
            FROM appeals a
            ${whereClause}
        `, params);

        const formattedAppeals = appeals.map(appeal => ({
            id: appeal.id,
            user: {
                id: appeal.user_id,
                username: appeal.user_username,
                name: appeal.user_name,
                avatar: appeal.user_avatar
            },
            restriction_type: appeal.restriction_type,
            reason: appeal.reason,
            status: appeal.status,
            created_at: appeal.created_at,
            reviewed_at: appeal.reviewed_at,
            response: appeal.response,
            original_decision: appeal.original_decision,
            original_punishment_reason: appeal.original_punishment_reason,
            punishment_date: appeal.punishment_date,
            reviewer_username: appeal.reviewer_username
        }));

        return RouterHelper.success({
            appeals: formattedAppeals,
            total: totalCount[0]?.count || 0,
            hasMore: appeals.length === limit
        });
    } catch (error) {
        console.error('Ошибка загрузки апелляций для админа:', error);
        return RouterHelper.error('Ошибка загрузки апелляций');
    }
};

export default loadAdminAppeals;