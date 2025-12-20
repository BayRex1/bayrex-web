import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const loadDashboardStats = async ({ data }) => {
    try {
        const { period = '7d' } = data.payload || {};
        
        let dateFilter = '';
        switch (period) {
            case '1d':
                dateFilter = "AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
                break;
            case '7d':
                dateFilter = "AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
                break;
            case '30d':
                dateFilter = "AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
                break;
            case 'all':
            default:
                dateFilter = '';
                break;
        }

        const reportsStats = await dbE.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM reports 
            WHERE 1=1 ${dateFilter}
        `);

        const punishmentsStats = await dbE.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                punishment_type,
                COUNT(*) as count
            FROM accounts_punishments 
            WHERE 1=1 ${dateFilter.replace('created_at', 'start_date')}
            GROUP BY punishment_type
        `);

        const topCategories = await dbE.query(`
            SELECT 
                category,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reports WHERE 1=1 ${dateFilter}), 1) as percentage
            FROM reports 
            WHERE 1=1 ${dateFilter}
            GROUP BY category 
            ORDER BY count DESC 
            LIMIT 10
        `);

        const dailyActivity = await dbE.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as reports_count,
                SUM(CASE WHEN status IN ('resolved', 'rejected') THEN 1 ELSE 0 END) as resolved_count
            FROM reports 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        const moderatorStats = await dbE.query(`
            SELECT 
                m.id as moderator_id,
                a.name as moderator_name,
                a.username as moderator_username,
                COUNT(DISTINCT mh.report_id) as reports_handled,
                COUNT(DISTINCT CASE WHEN mh.action_type = 'punishment_applied' THEN mh.punishment_id END) as punishments_applied,
                MAX(mh.created_at) as last_activity
            FROM moderation_history mh
            LEFT JOIN accounts a ON mh.moderator_id = a.ID
            LEFT JOIN (SELECT DISTINCT moderator_id as id FROM moderation_history) m ON m.id = mh.moderator_id
            WHERE mh.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY mh.moderator_id, a.name, a.username
            ORDER BY reports_handled DESC
        `);

        const systemStats = await dbE.query(`
            SELECT 
                (SELECT COUNT(*) FROM reports) as total_reports,
                (SELECT COUNT(*) FROM accounts_punishments) as total_punishments,
                (SELECT COUNT(*) FROM moderation_history) as total_actions,
                (SELECT COUNT(*) FROM accounts_punishments WHERE is_active = 1) as active_punishments
        `);

        const responseTime = await dbE.query(`
            SELECT 
                AVG(TIMESTAMPDIFF(HOUR, 
                    STR_TO_DATE(created_at, '%Y-%m-%dT%H:%i:%s.%fZ'), 
                    COALESCE(updated_at, NOW())
                )) as avg_response_hours
            FROM reports 
            WHERE status IN ('resolved', 'rejected')
            AND updated_at IS NOT NULL
            ${dateFilter}
        `);

        return RouterHelper.success({
            period,
            reports: reportsStats[0] || { total: 0, pending: 0, under_review: 0, resolved: 0, rejected: 0 },
            punishments: {
                total: punishmentsStats.reduce((sum, p) => sum + p.count, 0),
                active: punishmentsStats.reduce((sum, p) => sum + (p.active || 0), 0),
                by_type: punishmentsStats.map(p => ({ type: p.punishment_type, count: p.count }))
            },
            categories: topCategories || [],
            daily_activity: dailyActivity || [],
            moderators: moderatorStats || [],
            system: systemStats[0] || { total_reports: 0, total_punishments: 0, total_actions: 0, active_punishments: 0 },
            response_time: Math.round(responseTime[0]?.avg_response_hours || 0)
        });

    } catch (error) {
        console.error('Ошибка при загрузке статистики дашборда:', error);
        return RouterHelper.error('Ошибка загрузки статистики');
    }
};

export default loadDashboardStats; 