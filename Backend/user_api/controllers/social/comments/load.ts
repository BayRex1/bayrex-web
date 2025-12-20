import { dbE } from '../../../../lib/db.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { getDate } from '../../../../system/global/Function.js';

const accountDataHelper = new AccountDataHelper();

const handleContent = async (content) => {
    const newContent = content;

    if (content.reply) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const updateDate = new Date(content.reply.update_date);

        if (updateDate < oneHourAgo) {
            newContent.reply.author = await accountDataHelper.getAuthorData(content.reply.author.id);
            newContent.reply.update_date = getDate();
            newContent.reply.author.avatar = newContent.reply.author.avatar
                ? newContent.reply.author.avatar
                : null;

            return newContent;
        } else {
            return content;
        }
    } else {
        return content;
    }
};

const load = async ({ account, data }) => {
    const { post_id } = data.payload;
    const comments: any = [];

    const rows = await dbE.query('SELECT * FROM comments WHERE `post_id` = ? ORDER BY `date` DESC', [post_id]);

    for (const comment of rows) {
        const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;
        const deleted = comment.in_trash === 1 && canViewTrash;
        const author: any = await accountDataHelper.getAuthorData(comment.uid);
        const userIcons = [];
        const content = comment.content ? await handleContent(comment.content) : null;
        const isBlocked = await accountDataHelper.checkBlock(account.ID, author.id, 0);

        if (author.id) {
            userIcons.push(...await accountDataHelper.getIcons(author.id));
        }

        comments.push({
            id: comment.id,
            author: {
                id: author.id,
                username: author.username,
                name: author.name,
                avatar: await AccountDataHelper.getAvatar(author.avatar),
                icons: userIcons,
                blocked: isBlocked
            },
            post_id: comment.post_id,
            type: comment.type,
            text: comment.text,
            content,
            date: comment.date,
            ...(deleted && { deleted: true }),
        });
    }

    return RouterHelper.success({
        comments: comments
    })
}

export default load;
