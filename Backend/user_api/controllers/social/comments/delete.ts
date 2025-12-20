import CommentManager from '../../../../services/posts/CommentManager.js';

const delete_comment = async ({ account, data }) => {
    const { comment_id } = data.payload;

    const answer = await CommentManager.moveToTrash({
        account,
        cid: comment_id
    });

    return answer;
}

export default delete_comment;
