import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const submitAppeal = async ({ account, data }) => {
    const { restriction_type, reason } = data.payload;

    if (!restriction_type || !reason) {
        return RouterHelper.error('Не все данные указаны');
    }

    if (!reason.trim() || reason.trim().length < 10) {
        return RouterHelper.error('Причина апелляции должна содержать минимум 10 символов');
    }

    if (reason.length > 2000) {
        return RouterHelper.error('Причина апелляции слишком длинная');
    }

    const validRestrictionTypes = ['posts', 'comments', 'chat', 'music'];
    if (!validRestrictionTypes.includes(restriction_type)) {
        return RouterHelper.error('Неверный тип ограничения');
    }

    return await dbE.withTransaction(async (conn) => {
        const latestPunishment = await conn.query(`
            SELECT * FROM accounts_punishments 
            WHERE user_id = ? 
            AND punishment_type = ? 
            AND is_active = 1
            ORDER BY created_at DESC 
            LIMIT 1
        `, [account.ID ?? account.id, `restrict_${restriction_type}`]);

        let reportId = 0;
        let originalDecision = 'Ограничение установлено системой';

        if (latestPunishment.length > 0) {
            const punishment: any = latestPunishment[0];
            reportId = punishment.report_id || 0;
            originalDecision = punishment.reason || 'Ограничение установлено системой';
            
            const existingAppeals = await conn.query(
                'SELECT * FROM appeals WHERE user_id = ? AND restriction_type = ? AND report_id = ? AND status IN (?, ?)',
                [account.ID ?? account.id, restriction_type, reportId, 'pending', 'under_review']
            );

            if (existingAppeals.length > 0) {
                return RouterHelper.error('У вас уже есть активная апелляция по данному ограничению');
            }
        } else {
            const existingAppeals = await conn.query(
                'SELECT * FROM appeals WHERE user_id = ? AND restriction_type = ? AND report_id = 0 AND status IN (?, ?)',
                [account.ID ?? account.id, restriction_type, 'pending', 'under_review']
            );

            if (existingAppeals.length > 0) {
                return RouterHelper.error('У вас уже есть активная апелляция по данному ограничению');
            }
        }

        console.log('Вставляем апелляцию в базу:', {
            reportId,
            userId: account.ID ?? account.id,
            restriction_type,
            reason: reason.trim(),
            originalDecision
        });

        const result = await conn.query(`
            INSERT INTO appeals (
                report_id, 
                user_id, 
                restriction_type, 
                reason, 
                status, 
                created_at, 
                original_decision
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?)
        `, [
            reportId,
            account.ID ?? account.id,
            restriction_type,
            reason.trim(),
            'pending',
            originalDecision
        ]);

        console.log('Результат вставки:', result);

        return RouterHelper.success('Апелляция подана успешно');
    });
};

export default submitAppeal;