import AccountManager from '../../../../services/account/AccountManager.js';
import Validator from '../../../../services/system/Validator.js';
import { fileTypeFromBuffer } from 'file-type';
import ImageEngine from '../../../../services/system/ImageEngine.js';
import FileManager from '../../../../services/system/FileManager.js';
import { getDate } from '../../../../system/global/Function.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import { send } from '../../../../notify_service/send.js';
import { dbE } from '../../../../lib/db.js';

const imageEngine = new ImageEngine();
const validImageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

const getFilesType = async (
    files: { name: string, type: string, size: number, buffer: Uint8Array }[]
): Promise<'images' | 'files' | 'mixed'> => {
    let hasImage = false;
    let hasFile = false;

    for (const file of files) {
        const buffer = Buffer.from(file.buffer);
        const type = await fileTypeFromBuffer(buffer);

        if (type && validImageTypes.includes(type.mime)) {
            hasImage = true;
        } else {
            hasFile = true;
        }

        if (hasImage && hasFile) return 'mixed';
    }

    if (hasImage) return 'images';
    if (hasFile) return 'files';

    return 'files';
};

export const recount = async (postID: number) => {
    const comments = await dbE.query('SELECT COUNT(*) AS count FROM comments WHERE post_id = ?', [postID]);
    await dbE.query('UPDATE posts SET Comments = ? WHERE ID = ?', [comments[0].count, postID]);
}

const postExists = async (postID: number) => {
    const post = await dbE.query('SELECT COUNT(*) AS count FROM posts WHERE ID = ?', [postID]);
    return post[0].count > 0;
}

const add = async ({ account, data }) => {
    const accountManager = new AccountManager(account.ID);
    const currentPermissions = await accountManager.getPermissions();
    
    if (!currentPermissions || !currentPermissions.Comments) {
        const activePunishment = await dbE.query(`
            SELECT reason, punishment_type, end_date 
            FROM accounts_punishments 
            WHERE user_id = ? AND punishment_type IN ('restrict_comments', 'ban') AND is_active = 1
            ORDER BY start_date DESC 
            LIMIT 1
        `, [account.ID]);
        
        if (activePunishment && activePunishment.length > 0) {
            const punishment = activePunishment[0];
            const punishmentText = punishment.punishment_type === 'ban' ? 'заблокирован' : 'ограничены комментарии';
            const reason = punishment.reason || 'Причина не указана';
            const endDate = punishment.end_date ? 
                new Date(punishment.end_date).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : '';
            
            const message = `У вас ${punishmentText}. Причина: ${reason}` + 
                           (endDate ? `. До: ${endDate}` : '');
            
            return RouterHelper.error(message);
        } else {
            return RouterHelper.error('У вас ограничена возможность публикации комментариев');
        }
    }
    const isGold = await accountManager.getGoldStatus();

    const { text, files, post_id, reply_to } = data.payload || {};
    let commentReply: any = {};
    const now = Date.now();

    const filesCount = files?.length || 0;
    const fileSizeLimit = isGold ? 50 * 1024 * 1024 : 20 * 1024 * 1024;

    if (!text && text.trim() === '' && filesCount < 1) return RouterHelper.error('Нельзя отправить пустой комментарий');

    const validator = new Validator();

    if (text) {
        validator.validateText({
            title: 'Текст комментария',
            value: text,
            maxLength: 30000
        });
    }

    if (!await postExists(post_id)) {
        return RouterHelper.error('Пост не найден');
    }

    const lastComment = await dbE.query(
        'SELECT date FROM comments WHERE uid = ? ORDER BY date DESC LIMIT 1',
        [account.ID]
    );

    if (lastComment.length && now - new Date(lastComment[0].date).getTime() < 15000)
        return RouterHelper.error('Куда так быстро?');

    let totalFileSize = 0;
    let contentType = 'text';
    let content: any = {};

    if (files.length > 150) {
        return RouterHelper.error('Можно добавить не более 150 файлов');
    }

    if (filesCount > 0) {
        if (filesCount > 150) return RouterHelper.error('Максимальное количество файлов 150');

        contentType = await getFilesType(files);

        for (const file of files) {
            totalFileSize += file.buffer.length;
            if (totalFileSize > fileSizeLimit) break;
        }

        if (totalFileSize > fileSizeLimit)
            return isGold
                ? RouterHelper.error('Размер файлов не должен превышать 50 MB.')
                : RouterHelper.error('Размер файлов не должен превышать 20 MB, вы можете увеличить лимит до 50 MB, купив подписку Gold.');
    }

    if (reply_to) {
        const comment = await dbE.query(
            'SELECT id, uid, text FROM comments WHERE id = ?',
            [reply_to]
        );    

        if (comment.length < 1) return RouterHelper.error('Комментарий не найден');

        const accountDataHelper = new AccountDataHelper();
        const author = await accountDataHelper.getAuthorData(comment[0].uid);

        if (!author) return RouterHelper.error('Автор комментария не найден');

        commentReply = {
            comment_id: comment[0].id,
            author: {
                id: author.id,
                name: author.name,
                username: author.username,
                avatar: author.avatar
            },
            text: comment[0].text,
            update_date: getDate()
        }

        content.reply = commentReply;
    }

    let c_images = [];
    let c_files = [];

    for (const file of files) {
        const fileType = await fileTypeFromBuffer(file.buffer);

        if (fileType?.mime.startsWith('image/')) {
            c_images.push({
                buffer: file.buffer,
                name: file.name
            });
        } else {
            c_files.push({
                buffer: file.buffer,
                name: file.name
            });
        }
    }

    for (const image of c_images) {
        const file = await imageEngine.create({
            file: image.buffer,
            path: 'comments/images',
            simpleSize: 900,
            preview: true
        });

        if (file) {
            if (!content.images) content.images = [];

            content.images.push({
                img_data: file,
                file_name: image.name,
                file_size: image.buffer.length
            });
        }
    }

    if (c_files.length > 0) {
        for (const file of c_files) {
            const uploadedFile = await FileManager.saveFile('comments/files', file.buffer);

            if (uploadedFile) {
                if (!content.files) content.files = [];

                content.files.push({
                    file: uploadedFile,
                    name: file.name,
                    size: file.buffer.length
                });
            }
        }
    }

    const res = await dbE.query('INSERT INTO comments (uid, post_id, type, text, content, date) VALUES (?, ?, ?, ?, ?, ?)', [
        account.ID,
        post_id,
        contentType,
        text,
        content ? JSON.stringify(content) : null,
        getDate()
    ]);

    const accountDataHelper = new AccountDataHelper();
    const author = await accountDataHelper.getAuthorDataFromPost(post_id);

    if (author && author.type === 0 && author.data.ID !== account.ID) {
        send(author.data.ID, {
            from: account.ID,
            action: 'PostComment',
            content: {
                post: {
                    id: post_id,
                },
                comment: {
                    id: res.insertId,
                    text: text
                }
            }
        });
    }

    if (reply_to && commentReply.author.id !== account.ID) {
        send(commentReply.author.id, {
            from: account.ID,
            action: 'ReplyComment',
            content: {
                post: {
                    id: post_id,
                },
                comment: {
                    id: res.insertId,
                    text: text
                }
            }
        });
    }

    await accountManager.maybeReward('comment');
    await recount(post_id);

    return RouterHelper.success({
        comment_id: res.insertId
    })
}

export default add;
