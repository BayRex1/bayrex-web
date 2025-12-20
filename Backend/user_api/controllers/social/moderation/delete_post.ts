import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { send } from '../../../../notify_service/send.js';

export const deletePost = async ({ account, data }) => {
    try {
        const { post_id } = data;

        if (!post_id) {
            return RouterHelper.error('Не указан ID поста');
        }

        return await dbE.withTransaction(async (conn) => {
            const posts = await conn.query('SELECT * FROM posts WHERE id = ?', [post_id]);
            
            if (!posts || posts.length < 1) {
                return RouterHelper.error('Пост не найден');
            }

            const post = posts[0] as any;
            const authorId = post.author_id;

            await conn.query(
                'UPDATE posts SET hidden = 1 WHERE id = ?', 
                [post_id]
            );

            await conn.query(
                'UPDATE comments SET hidden = 1 WHERE post_id = ?', 
                [post_id]
            );

            await send(authorId, {
                from: account.ID,
                type: 'notification',
                subtype: 'post_deleted',
                title: 'Пост удален',
                message: `Ваш пост был удален модератором`,
                data: {
                    post_id: post_id,
                    moderator_id: account.ID
                }
            });

            return RouterHelper.success({
                message: 'Пост успешно удален',
                post_id
            });
        });

    } catch (error) {
        console.error('Ошибка при удалении поста:', error);
        return RouterHelper.error('Произошла ошибка при удалении поста');
    }
}; 