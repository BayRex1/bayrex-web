import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const updateAppealStatus = async ({ account, data }) => {
    const { appeal_id, status } = data.payload;

    if (!appeal_id || !status) {
        return RouterHelper.error('Не все данные указаны');
    }

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
        return RouterHelper.error('Неверный статус');
    }

    try {
        const appeals = await dbE.query(
            'SELECT * FROM appeals WHERE id = ?',
            [appeal_id]
        );

        if (appeals.length === 0) {
            return RouterHelper.error('Апелляция не найдена');
        }

        await dbE.query(`
            UPDATE appeals 
            SET status = ?, 
                reviewer_id = ?
            WHERE id = ?
        `, [status, account.ID ?? account.id, appeal_id]);

        return RouterHelper.success('Статус апелляции обновлен');
    } catch (error) {
        console.error('Ошибка обновления статуса апелляции:', error);
        return RouterHelper.error('Ошибка обновления статуса апелляции');
    }
};

export default updateAppealStatus;