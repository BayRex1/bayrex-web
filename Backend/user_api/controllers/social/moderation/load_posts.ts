import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

export const loadPosts = async ({ data }) => {
    try {
        const { start_index = 0 } = data;

        const posts = await dbE.query(`
            SELECT p.*, 
                a.username as author_name,
                0 as is_deleted
            FROM posts p
            LEFT JOIN accounts a ON p.author_id = a.ID  
            ORDER BY p.date DESC
            LIMIT 25 OFFSET ?
        `, [start_index]);

        const postsWithStatus = posts.map(post => ({
            ...post,
            status: 'active',
            deleted_at: null,
            deleted_by: null,
            moderator_name: null,
            is_deleted: false
        }));

        return RouterHelper.success({
            posts: postsWithStatus,
            total: posts.length
        });

    } catch (error) {
        console.error('Ошибка при загрузке постов для модерации:', error);
        return RouterHelper.error('Произошла ошибка при загрузке постов');
    }
}; 