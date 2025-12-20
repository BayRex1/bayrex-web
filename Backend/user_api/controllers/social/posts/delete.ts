import PostManager from '../../../../services/posts/PostManager.js';

const delete_post = async ({ account, data }) => {
    const { post_id } = data.payload;

    const answer = await PostManager.moveToTrash({
        account,
        pid: post_id
    });

    return answer;
}

export default delete_post;
