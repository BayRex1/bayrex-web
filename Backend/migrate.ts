import { dbE } from './lib/db.js';

const hl = async (row) => {
    if (!row.content) {
        console.log(`Нет контента для уведомления ID ${row.id}`);
        return;
    }

    const newContent = {
        post: {
            id: row.content
        }
    }

    await dbE.query(
        'UPDATE notifications SET content = ? WHERE id = ?',
        [JSON.stringify(newContent), row.id]
    );
}

const hs = async (row) => {
    if (!row.content) {
        console.log(`Нет контента для уведомления ID ${row.id}`);
        return;
    }
    if (typeof row.content !== 'string') {
        console.log(`Неверный тип контента для уведомления ID ${row.id}`);
        return;
    }

    const account = await dbE.query(
        'SELECT ID FROM accounts WHERE Username = ?',
        [row.content]
    );

    const newContent = {
        profile: {
            id: account[0]?.ID || null,
            username: row.content
        }
    }
    await dbE.query(
        'UPDATE notifications SET content = ? WHERE id = ?',
        [JSON.stringify(newContent), row.id]
    );
}

const hc = async (row) => {
    if (!row.content) {
        console.log(`Нет контента для уведомления ID ${row.id}`);
        return;
    }
    if (typeof row.content !== 'string') {
        console.log(`Неверный тип контента для уведомления ID ${row.id}`);
        return;
    }

    const content = row.content;
    const postId = content?.PostID;
    const newContent = {
        post: {
            id: postId
        },
        comment: {
            id: null,
            text: content?.Text || null
        }
    }

    await dbE.query(
        'UPDATE notifications SET content = ? WHERE id = ?',
        [JSON.stringify(newContent), row.id]
    );
}

const run = async () => {
    const n = await dbE.query('SELECT * FROM notifications');

    for (const row of n) {
        console.log('Обработка уведомления ID:', row.id);
        try {
            switch (row.action) {
                case 'PostLike':
                    await hl(row);
                    break;
                case 'PostDislike':
                    await hl(row);
                    break;
                case 'ProfileSubscribe':
                    await hs(row);
                    break;
                case 'ProfileUnsubscribe':
                    await hs(row);
                    break;
                case 'PostComment':
                    await hc(row);
                    break;
                default:
                    console.log(`Неизвестное действие: ${row.action} для уведомления ID ${row.id}`);
                    break;
            }
        } catch (error) {
            console.error(`Ошибка уведомления ID ${row.id}:`, error);
            await dbE.query(
                'UPDATE notifications SET content = ? WHERE id = ?',
                [null, row.id]
            );
        }
    }
}

run();