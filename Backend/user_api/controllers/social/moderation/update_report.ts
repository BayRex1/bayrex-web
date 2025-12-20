import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { getDate } from '../../../../system/global/Function.js';

const updateReport = async ({ account, data }) => {
    const { report_id, status, resolution, priority } = data.payload || {};

    if (!report_id || !status) {
        return RouterHelper.error('Не указан ID репорта или статус');
    }

    const validStatuses = ['pending', 'under_review', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
        return RouterHelper.error('Недопустимый статус');
    }

    return await dbE.withTransaction(async (conn) => {
        const reports = await conn.query(
            'SELECT * FROM reports WHERE id = ?',
            [report_id]
        ) as any[];

        if (reports.length === 0) {
            return RouterHelper.error('Репорт не найден');
        }

        const report = reports[0];
        const oldStatus = report.status;

        const updateData: any = {
            status,
            admin_id: account.ID
        };

        if ((status === 'resolved' || status === 'rejected') && resolution) {
            updateData.resolution = resolution;
            updateData.updated_at = getDate();
        }

        if (priority && ['low', 'medium', 'high', 'critical'].includes(priority)) {
            updateData.priority = priority;
        }

        const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const updateValues = Object.values(updateData);
        updateValues.push(report_id);

        await conn.query(
            `UPDATE reports SET ${updateFields} WHERE id = ?`,
            updateValues
        );

        // Записываем в историю модерации
        let actionType = 'report_reviewed';
        if (status === 'resolved') {
            actionType = 'report_resolved';
        } else if (status === 'rejected') {
            actionType = 'report_rejected';
        } else if (status === 'under_review' && oldStatus !== 'under_review') {
            actionType = 'report_reviewed';
        }

        // Записываем действие в историю
        await conn.query(
            `INSERT INTO moderation_history 
             (report_id, moderator_id, action_type, target_type, target_id, details, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                report_id,
                account.ID,
                actionType,
                report.target_type || 'other',
                report.target_id || 0,
                JSON.stringify({
                    old_status: oldStatus,
                    new_status: status,
                    resolution: resolution || null,
                    priority: priority || null
                }),
                getDate()
            ]
        );

        return RouterHelper.success({
            message: 'Статус репорта обновлен'
        });
    });
};

export default updateReport; 