import { dbE } from '../../../../../lib/db.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';

const delete_session = async ({ account, data }) => {
    const { session_id } = data;

    if (!session_id) {
        return RouterHelper.error('Не указана сессия для удаления');
    }

    const result = await dbE.query(
        'DELETE FROM `accounts_sessions` WHERE `id` = ? AND `uid` = ?',
        [session_id, account.ID]
    );

    if (result.affectedRows === 0) {
        return RouterHelper.error('Сессия не найдена, или у вас нет прав для её удаления');
    }

    return RouterHelper.success();
}

export default delete_session;
