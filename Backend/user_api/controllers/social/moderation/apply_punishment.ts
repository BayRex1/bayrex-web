import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { getDate, getEndDate } from '../../../../system/global/Function.js';
import { send } from '../../../../notify_service/send.js';

const applyPunishment = async ({ account, data }) => {
    const { user_id, punishment_type, duration_hours, reason, report_id } = data.payload || {};

    if (!user_id || !punishment_type || !reason) {
        return RouterHelper.error('Не все данные указаны');
    }

    const validPunishments = ['warn', 'restrict_posts', 'restrict_comments', 'restrict_chat', 'restrict_music', 'ban'];
    if (!validPunishments.includes(punishment_type)) {
        return RouterHelper.error('Недопустимый тип наказания');
    }

    return await dbE.withTransaction(async (conn) => {
        const users = await conn.query('SELECT * FROM accounts WHERE ID = ?', [user_id]);
        if (!users || users.length < 1) {
            return RouterHelper.error('Пользователь не найден');
        }

        const permissions: any = await conn.query('SELECT * FROM accounts_permissions WHERE UserID = ?', [user_id]);
        
        if (permissions.length === 0) {
            await conn.query(
                'INSERT INTO accounts_permissions (UserID, Admin, Posts, Comments, NewChats, MusicUpload) VALUES (?, 0, 1, 1, 1, 1)',
                [user_id]
            );
        }

        const endDate = punishment_type === 'ban' ? null : getEndDate(duration_hours);

        let updateQuery = '';
        let updateParams = [];

        switch (punishment_type) {
            case 'restrict_posts':
                updateQuery = 'UPDATE accounts_permissions SET Posts = 0 WHERE UserID = ?';
                updateParams = [user_id];
                break;
            case 'restrict_comments':
                updateQuery = 'UPDATE accounts_permissions SET Comments = 0 WHERE UserID = ?';
                updateParams = [user_id];
                break;
            case 'restrict_chat':
                updateQuery = 'UPDATE accounts_permissions SET NewChats = 0 WHERE UserID = ?';
                updateParams = [user_id];
                break;
            case 'restrict_music':
                updateQuery = 'UPDATE accounts_permissions SET MusicUpload = 0 WHERE UserID = ?';
                updateParams = [user_id];
                break;
            case 'ban':
                updateQuery = 'UPDATE accounts_permissions SET Posts = 0, Comments = 0, NewChats = 0, MusicUpload = 0 WHERE UserID = ?';
                updateParams = [user_id];
                break;
            case 'warn':
                break;
        }

        if (updateQuery) {
            await conn.query(updateQuery, updateParams);
            const updatedPermissions = await conn.query(
                'SELECT * FROM accounts_permissions WHERE UserID = ?',
                [user_id]
            );
            if (updatedPermissions.length > 0) {
                const perms = updatedPermissions[0] as any;
                await send(user_id, {
                    from: account.ID,
                    action: 'permissions_updated',
                    content: {
                        type: 'permissions_updated',
                        payload: {
                            Posts: !!perms.Posts,
                            Comments: !!perms.Comments,
                            NewChats: !!perms.NewChats,
                            MusicUpload: !!perms.MusicUpload,
                            Admin: !!perms.Admin,
                            Verified: !!perms.Verified,
                            Fake: !!perms.Fake
                        }
                    }
                });
            }
        }

        const punishmentResult = await conn.query(
            `INSERT INTO accounts_punishments 
             (user_id, moderator_id, punishment_type, reason, duration_hours, start_date, end_date, is_active, report_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
                user_id,
                account.ID,
                punishment_type,
                reason,
                duration_hours || null,
                getDate(),
                endDate,
                report_id || null
            ]
        ) as any;

        const punishmentId = punishmentResult.insertId;

        let reportDetails = null;
        if (report_id) {
            const reportData = await conn.query('SELECT * FROM reports WHERE id = ?', [report_id]) as any[];
            if (reportData.length > 0) {
                const report = reportData[0];
                reportDetails = {
                    report_category: report.category,
                    report_message: report.message,
                    target_type: report.target_type,
                    target_id: report.target_id
                };
            }
        }

        await conn.query(
            `INSERT INTO moderation_history 
             (report_id, punishment_id, moderator_id, action_type, target_type, target_id, details, created_at)
             VALUES (?, ?, ?, 'punishment_applied', 'user', ?, ?, ?)`,
            [
                report_id || null,
                punishmentId,
                account.ID,
                user_id,
                JSON.stringify({
                    punishment_type,
                    reason,
                    duration_hours,
                    end_date: endDate,
                    ...reportDetails
                }),
                getDate()
            ]
        );

        const punishmentNames = {
            'restrict_posts': 'ограничение на создание постов',
            'restrict_comments': 'ограничение на комментарии',
            'restrict_chat': 'ограничение на создание чатов',
            'restrict_music': 'ограничение на загрузку музыки',
            'ban': 'блокировка аккаунта',
            'warn': 'предупреждение'
        };

        const punishmentName = punishmentNames[punishment_type] || punishment_type;
        const durationText = punishment_type === 'ban' ? '' :
            duration_hours ? ` на ${duration_hours} часов` : '';

        const sourceText = report_id ?
            'по результатам рассмотрения жалобы' :
            'администратором';

        await send(user_id, {
            from: account.ID,
            action: 'notification',
            content: {
                type: 'notification',
                subtype: 'punishment_applied',
                title: 'Наложено ограничение',
                message: `На ваш аккаунт наложено ${sourceText}: ${punishmentName}${durationText}. Причина: ${reason}`,
                data: {
                    punishment_type,
                    reason,
                    duration_hours,
                    end_date: endDate,
                    moderator_id: account.ID,
                    requires_relogin: true
                }
            },
            viewed: 0,
            date: getDate()
        });

        return RouterHelper.success({
            message: 'Наказание успешно применено',
            punishment_id: punishmentId
        });
    });
};

export default applyPunishment; 