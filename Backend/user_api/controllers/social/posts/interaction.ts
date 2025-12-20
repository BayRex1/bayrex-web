import { dbE } from "../../../../lib/db.js";
import { send } from "../../../../notify_service/send.js";
import AccountDataHelper from "../../../../services/account/AccountDataHelper.js";
import { getDate } from "../../../../system/global/Function.js";

export const like = async ({ account, data }) => {
    const { post_id } = data.payload;

    if (await userLiked(post_id, account.ID)) {
        await dbE.query("DELETE FROM post_likes WHERE PostID = ? AND UserID = ?", [post_id, account.ID]);
    } else {
        if (await userDisliked(post_id, account.ID)) {
            await dbE.query("DELETE FROM post_dislikes WHERE PostID = ? AND UserID = ?", [post_id, account.ID]);
        }
        await dbE.query("INSERT INTO post_likes (PostID, UserID, Date) VALUES (?, ?, ?)", [post_id, account.ID, getDate()]);
    }

    await recalculate(post_id);

    const accountDataHelper = new AccountDataHelper();
    const author = await accountDataHelper.getAuthorDataFromPost(post_id);

    if (author && author.type === 0 && author.data.ID !== account.ID) {
        send(author.data.ID, {
            from: account.ID,
            action: 'PostLike',
            content: {
                post: {
                    id: post_id,
                }
            }
        });
    }
};

export const dislike = async ({ account, data }) => {
    const { post_id } = data.payload;

    if (await userDisliked(post_id, account.ID)) {
        await dbE.query("DELETE FROM post_dislikes WHERE PostID = ? AND UserID = ?", [post_id, account.ID]);
    } else {
        if (await userLiked(post_id, account.ID)) {
            await dbE.query("DELETE FROM post_likes WHERE PostID = ? AND UserID = ?", [post_id, account.ID]);
        }
        await dbE.query("INSERT INTO post_dislikes (PostID, UserID, Date) VALUES (?, ?, ?)", [post_id, account.ID, getDate()]);
    }

    await recalculate(post_id);

    const accountDataHelper = new AccountDataHelper();
    const author = await accountDataHelper.getAuthorDataFromPost(post_id);

    if (author && author.type === 0 && author.data.ID !== account.ID) {
        send(author.data.ID, {
            from: account.ID,
            action: 'PostDislike',
            content: {
                post: {
                    id: post_id,
                }
            }
        });
    }
};

const userLiked = async (postId, userId) => {
    const rows = await dbE.query("SELECT 1 FROM post_likes WHERE PostID = ? AND UserID = ?", [postId, userId]);
    return rows.length > 0;
};

const userDisliked = async (postId, userId) => {
    const rows = await dbE.query("SELECT 1 FROM post_dislikes WHERE PostID = ? AND UserID = ?", [postId, userId]);
    return rows.length > 0;
};

const recalculate = async (postId) => {
    await dbE.query(`
        UPDATE posts
        SET likes = (SELECT COUNT(*) FROM post_likes WHERE PostID = ?),
            dislikes = (SELECT COUNT(*) FROM post_dislikes WHERE PostID = ?)
        WHERE id = ?
    `, [postId, postId, postId]);
};
