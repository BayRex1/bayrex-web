import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { getDate } from '../../../../system/global/Function.js';

const ALLOWED_CATEGORIES: Record<string, string[]> = {
    user: [
        'spam',
        'animal_cruelty',
        'child_porn',
        'weapon_sales',
        'drug_sales',
        'personal_data_without_consent',
        'other'
    ],
    music: [
        'meaningless_content',
        'other'
    ],
    post: [
        'spam',
        'animal_cruelty',
        'child_porn',
        'weapon_sales',
        'drug_sales',
        'personal_data_without_consent',
        'other'
    ],
    comment: [
        'spam',
        'animal_cruelty',
        'child_porn',
        'weapon_sales',
        'drug_sales',
        'personal_data_without_consent',
        'other'
    ],
    channel: [
        'spam',
        'animal_cruelty',
        'child_porn',
        'weapon_sales',
        'drug_sales',
        'personal_data_without_consent',
        'other'
    ]
};

const sendReport = async ({ account, data }) => {
    const { target_type, target_id, category, message = null } = data.payload || {};

    if (!target_type || !target_id || !category) {
        return RouterHelper.error('Не все данные указаны');
    }

    if (
        !ALLOWED_CATEGORIES[target_type] ||
        !ALLOWED_CATEGORIES[target_type].includes(category)
    ) {
        return RouterHelper.error('Недопустимая категория жалобы');
    }

    // Для пользователей target_id может быть числом (ID), остальные должны быть числами
    if (target_type !== 'user' && (!Number.isInteger(target_id) || target_id <= 0)) {
        return RouterHelper.error('Некорректный ID объекта');
    }

    if (target_type === 'user' && (!target_id || (typeof target_id !== 'number' && typeof target_id !== 'string'))) {
        return RouterHelper.error('Некорректный ID пользователя');
    }

    if (typeof category !== 'string' || category.length > 64) {
        return RouterHelper.error('Категория должна быть строкой до 64 символов');
    }

    if (message && typeof message !== 'string') {
        return RouterHelper.error('Сообщение должно быть строкой');
    }

    return await dbE.withTransaction(async (conn) => {
        const reportResult = await conn.query(
            `INSERT INTO reports 
             (author_id, target_type, target_id, category, message, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
            [
                account.ID,
                target_type,
                target_id,
                category,
                message || null,
                getDate()
            ]
        ) as any;

        const reportId = reportResult.insertId;

        await conn.query(
            `INSERT INTO moderation_history 
             (report_id, moderator_id, action_type, target_type, target_id, details, created_at)
             VALUES (?, ?, 'report_created', ?, ?, ?, ?)`,
            [
                reportId,
                account.ID,
                target_type,
                target_id,
                JSON.stringify({
                    category,
                    message,
                    author_id: account.ID
                }),
                getDate()
            ]
        );

        return RouterHelper.success({
            report_id: reportId
        });
    });
};

export default sendReport;
