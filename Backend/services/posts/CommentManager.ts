import { getDate } from '../../system/global/Function.js';
import RouterHelper from '../system/RouterHelper.js';
import { dbE } from '../../lib/db.js';

class CommentManager {
    static async moveToTrash({ account, cid }) {
        const commentResult = await dbE.query(
            'SELECT uid, in_trash FROM comments WHERE id = ?',
            [cid]
        );
        const comment = commentResult?.[0];
        
        if (!comment) {
            return RouterHelper.error('Комментарий не найден');
        }
        if (comment.in_trash === 1) {
            return RouterHelper.error('Комментарий уже в корзине');
        }

        const canManageAny = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;

        if (!canManageAny) {
            if (Number(comment.uid) !== Number(account.ID)) {
                return RouterHelper.error('Вы не владелец этого комментария');
            }
        }

        await dbE.query(
            'UPDATE comments SET in_trash = 1, deleted_at = ? WHERE id = ?',
            [getDate(), cid]
        );

        return RouterHelper.success({
            message: 'Комментарий успешно удален'
        });
    }
}

export default CommentManager;