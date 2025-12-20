import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const loadModerationHistory = async ({ data }) => {
    try {
        const { target_type, target_id, report_id, punishment_id, limit = 50, offset = 0 } = data.payload || {};
        
        let query = `
            SELECT 
                mh.*,
                m.Username as moderator_username,
                m.Name as moderator_name,
                m.Avatar as moderator_avatar,
                r.category as report_category,
                r.message as report_message,
                r.status as report_status,
                p.punishment_type,
                p.reason as punishment_reason,
                p.duration_hours,
                p.start_date as punishment_start,
                p.end_date as punishment_end,
                p.is_active as punishment_active
            FROM moderation_history mh
            LEFT JOIN accounts m ON mh.moderator_id = m.ID
            LEFT JOIN reports r ON mh.report_id = r.id
            LEFT JOIN accounts_punishments p ON mh.punishment_id = p.id
        `;
        
        const conditions = [];
        const params: any[] = [];
        
        if (target_type && target_id) {
            conditions.push('mh.target_type = ? AND mh.target_id = ?');
            params.push(target_type, target_id);
        }
        
        if (report_id) {
            conditions.push('mh.report_id = ?');
            params.push(report_id);
        }
        
        if (punishment_id) {
            conditions.push('mh.punishment_id = ?');
            params.push(punishment_id);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY mh.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const history = await dbE.query(query, params) as any[];
        
        const processedHistory = history.map(item => ({
            id: item.id,
            action_type: item.action_type,
            target_type: item.target_type,
            target_id: item.target_id,
            created_at: item.created_at,
            details: item.details ? (typeof item.details === 'string' ? JSON.parse(item.details) : item.details) : null,
            moderator: {
                id: item.moderator_id,
                username: item.moderator_username,
                name: item.moderator_name,
                avatar: item.moderator_avatar
            },
            report: item.report_id ? {
                id: item.report_id,
                category: item.report_category,
                message: item.report_message,
                status: item.report_status
            } : null,
            punishment: item.punishment_id ? {
                id: item.punishment_id,
                type: item.punishment_type,
                reason: item.punishment_reason,
                duration_hours: item.duration_hours,
                start_date: item.punishment_start,
                end_date: item.punishment_end,
                is_active: !!item.punishment_active
            } : null
        }));
        
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM moderation_history mh
        `;
        
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        
        const countParams = params.slice(0, -2); // Убираем limit и offset
        const [countResult] = await dbE.query(countQuery, countParams) as any[];
        
        return RouterHelper.success({
            history: processedHistory,
            total: countResult.total,
            hasMore: offset + history.length < countResult.total
        });
        
    } catch (error) {
        console.error('Ошибка загрузки истории модерации:', error);
        return RouterHelper.error('Внутренняя ошибка сервера');
    }
};

export default loadModerationHistory; 