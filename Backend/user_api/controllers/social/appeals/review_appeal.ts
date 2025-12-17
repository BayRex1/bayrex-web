import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const reviewAppeal = async ({ account, data }) => {
    const { appeal_id, action, response_text } = data.payload;

    if (!appeal_id || !action) {
        return RouterHelper.error('Не все данные указаны');
    }

    if (!['approve', 'reject'].includes(action)) {
        return RouterHelper.error('Неверное действие');
    }

    if (!response_text || response_text.trim().length < 5) {
        return RouterHelper.error('Укажите ответ модератора (минимум 5 символов)');
    }

    if (response_text.length > 1000) {
        return RouterHelper.error('Ответ слишком длинный');
    }

    return await dbE.withTransaction(async (conn) => {
        const appeals: any = await conn.query(
            'SELECT * FROM appeals WHERE id = ?',
            [appeal_id]
        );

        if (appeals.length === 0) {
            return RouterHelper.error('Апелляция не найдена');
        }

        const appeal = appeals[0];

        if (appeal.status !== 'pending' && appeal.status !== 'under_review') {
            return RouterHelper.error('Апелляция уже обработана');
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        await conn.query(`
            UPDATE appeals 
            SET status = ?, 
                reviewed_at = NOW(), 
                reviewer_id = ?, 
                response = ?
            WHERE id = ?
        `, [newStatus, account.ID ?? account.id, response_text.trim(), appeal_id]);

        if (action === 'approve') {
            const restrictionTypeMap = {
                'posts': 'restrict_posts',
                'comments': 'restrict_comments', 
                'chat': 'restrict_chat',
                'music': 'restrict_music'
            };

            const punishmentType = restrictionTypeMap[appeal.restriction_type];
            if (punishmentType) {
                await conn.query(`
                    UPDATE accounts_punishments 
                    SET restored_at = NOW(), is_active = 0
                    WHERE user_id = ? AND punishment_type = ? AND is_active = 1
                `, [appeal.user_id, punishmentType]);

                const permissionField = appeal.restriction_type === 'posts' ? 'Posts' :
                                      appeal.restriction_type === 'comments' ? 'Comments' :
                                      appeal.restriction_type === 'chat' ? 'NewChats' :
                                      'MusicUpload';

                await conn.query(`
                    UPDATE accounts_permissions 
                    SET ${permissionField} = 1
                    WHERE UserID = ?
                `, [appeal.user_id]);
            }
        }

        return RouterHelper.success(`Апелляция ${action === 'approve' ? 'одобрена' : 'отклонена'}`);
    });
};

export default reviewAppeal;