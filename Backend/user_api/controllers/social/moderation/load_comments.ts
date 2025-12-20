import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

export const loadComments = async ({ data }) => {
    try {
        const { start_index = 0 } = data;

        const comments = await dbE.query(`
            SELECT c.id, c.uid, c.text, c.post_id, c.date, c.content,
                a.username as author_name,
                a.name as author_display_name,
                0 as is_deleted
            FROM comments c
            LEFT JOIN accounts a ON c.uid = a.ID  
            ORDER BY c.date DESC
            LIMIT 25 OFFSET ?
        `, [start_index]);

        const commentsWithStatus = comments.map(comment => ({
            ...comment,
            status: 'active',
            deleted_at: null,
            deleted_by: null,
            moderator_name: null,
            is_deleted: false
        }));

        return RouterHelper.success({
            comments: commentsWithStatus,
            total: comments.length
        });

    } catch (error) {
        console.error('Ошибка при загрузке комментариев для модерации:', error);
        return RouterHelper.error('Произошла ошибка при загрузке комментариев');
    }
}; 