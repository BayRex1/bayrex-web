import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const loadReports = async ({ data }) => {
    const { status, limit = 50, offset = 0 } = data.payload || {};
    
    let query = `
        SELECT 
            r.*,
            a.Username as author_username,
            a.Name as author_name,
            a.Avatar as author_avatar
        FROM reports r
        LEFT JOIN accounts a ON r.author_id = a.ID
    `;
    
    const params: any[] = [];
    
    if (status) {
        query += ' WHERE r.status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const reports = await dbE.query(query, params);
    
    for (const report of reports) {
        report.author = {
            id: report.author_id,
            username: report.author_username,
            name: report.author_name,
            avatar: report.author_avatar
        };
        
        delete report.author_username;
        delete report.author_name;
        delete report.author_avatar;
        
        if (report.target_type === 'user') {
            report.target_user_id = report.target_id;
        }
        
        if (report.target_type === 'post') {
            const posts = await dbE.query(
                'SELECT id, content, author_id FROM posts WHERE id = ?',
                [report.target_id]
            );
            if (posts.length > 0) {
                report.post = posts[0];
                report.target_user_id = posts[0].author_id;
            }
        } else if (report.target_type === 'comment') {
            const comments = await dbE.query(
                'SELECT id, text, post_id, uid FROM comments WHERE id = ?',
                [report.target_id]
            );
            if (comments.length > 0) {
                report.comment = comments[0];
                report.target_user_id = comments[0].uid;
            }
        } else if (report.target_type === 'user') {
            const users = await dbE.query(
                'SELECT ID, Username, Name, Avatar FROM accounts WHERE ID = ?',
                [report.target_id]
            );
            if (users.length > 0) {
                report.target_user = {
                    id: users[0].ID,
                    username: users[0].Username,
                    name: users[0].Name,
                    avatar: users[0].Avatar
                };
            }
        } else if (report.target_type === 'music') {
            const songs = await dbE.query(
                'SELECT id, title, artist, uid FROM songs WHERE id = ?',
                [report.target_id]
            );
            if (songs.length > 0) {
                report.song = songs[0];
                report.target_user_id = songs[0].uid;
            }
        }
    }
    
    const countQuery = status 
        ? 'SELECT COUNT(*) as total FROM reports WHERE status = ?'
        : 'SELECT COUNT(*) as total FROM reports';
    const countParams = status ? [status] : [];
    const [countResult] = await dbE.query(countQuery, countParams);
    
    return RouterHelper.success({
        reports,
        total: countResult.total,
        hasMore: offset + reports.length < countResult.total
    });
};

export default loadReports; 