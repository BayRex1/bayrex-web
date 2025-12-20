import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const loadMyReports = async ({ account }) => {
    try {
        const reports = await dbE.query(`
            SELECT 
                r.*,
                CASE 
                    WHEN r.target_type = 'user' THEN a.Username
                    WHEN r.target_type = 'post' THEN ap.Username  
                    WHEN r.target_type = 'comment' THEN ac.Username
                    ELSE NULL
                END as target_username,
                CASE 
                    WHEN r.target_type = 'user' THEN a.Name
                    WHEN r.target_type = 'post' THEN ap.Name
                    WHEN r.target_type = 'comment' THEN ac.Name
                    ELSE NULL
                END as target_name,
                CASE 
                    WHEN r.target_type = 'post' THEN p.content
                    ELSE NULL
                END as target_content,
                CASE 
                    WHEN r.target_type = 'comment' THEN c.text
                    ELSE NULL
                END as target_text,
                am.Username as moderator_username,
                am.Name as moderator_name,
                am.ID as moderator_id
            FROM reports r
            LEFT JOIN accounts a ON r.target_type = 'user' AND a.ID = r.target_id
            LEFT JOIN posts p ON r.target_type = 'post' AND p.id = r.target_id
            LEFT JOIN accounts ap ON r.target_type = 'post' AND ap.ID = p.author_id
            LEFT JOIN comments c ON r.target_type = 'comment' AND c.id = r.target_id
            LEFT JOIN accounts ac ON r.target_type = 'comment' AND ac.ID = c.uid
            LEFT JOIN accounts am ON r.admin_id = am.ID
            WHERE r.author_id = ?
            ORDER BY r.created_at DESC
            LIMIT 50
        `, [account.ID]);

        const processedReports = reports.map(report => ({
            ...report,
            target_info: {
                username: report.target_username || null,
                name: report.target_name || null,
                content: report.target_content || null,
                text: report.target_text || null
            },
            moderator_info: report.moderator_id ? {
                id: report.moderator_id,
                username: report.moderator_username,
                name: report.moderator_name
            } : null
        }));

        return RouterHelper.success({ 
            reports: processedReports,
            total: processedReports.length 
        });

    } catch (error) {
        console.error('Ошибка загрузки жалоб пользователя:', error);
        return RouterHelper.error('Внутренняя ошибка сервера');
    }
};

export default loadMyReports; 