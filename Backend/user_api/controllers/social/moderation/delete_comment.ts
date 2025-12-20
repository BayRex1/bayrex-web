import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { send } from '../../../../notify_service/send.js';

export const deleteComment = async ({ account, data }) => {
    try {
        const { comment_id } = data;

        if (!comment_id) {
            return RouterHelper.error('Не указан ID комментария');
        }

        return await dbE.withTransaction(async (conn) => {
            const comments = await conn.query('SELECT * FROM comments WHERE id = ?', [comment_id]);
            
            if (!comments || comments.length < 1) {
                return RouterHelper.error('Комментарий не найден');
            }

            const comment = comments[0] as any;
            const authorId = comment.uid;

            await conn.query(
                'UPDATE comments SET hidden = 1 WHERE id = ?', 
                [comment_id]
            );

            await send(authorId, {
                from: account.ID,
                type: 'notification',
                subtype: 'comment_deleted',
                title: 'Комментарий удален',
                message: `Ваш комментарий был удален модератором`,
                data: {
                    comment_id: comment_id,
                    moderator_id: account.ID
                }
            });

            return RouterHelper.success({
                message: 'Комментарий успешно удален',
                comment_id
            });
        });

    } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        return RouterHelper.error('Произошла ошибка при удалении комментария');
    }
}; 