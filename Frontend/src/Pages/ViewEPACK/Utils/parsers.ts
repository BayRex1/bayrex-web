const mapComment14 = (comment) => ({
    author: {
        name: comment.Name,
        username: comment.Username,
        avatar: comment.Avatar,
    },
    date: comment.Date,
    text: comment.Text,
});

const mapComment21 = (comment) => ({
    author: {
        name: comment.author_data.name,
        username: comment.author_data.username,
        avatar: comment.author_data.avatar,
    },
    date: comment.date,
    text: comment.text,
});

export const parse14 = (post) => ({
    post: {
        author: {
            name: post.Name,
            username: post.Username,
            avatar: post.Avatar,
        },
        date: post.Date,
        text: post.Text,
        content_type: post.Content?.Type,
        content: post.Content && {
            file_name: post.Content.Name,
            file_size: post.Content.Size,
            base64: post.Content.File || post.Content.Image,
        },
        stats: {
            likes: post.LikesCount,
            dislikes: post.DislikesCount,
            comments: null,
        },
    },
    comments: Array.isArray(post.Comments) ? post.Comments.map(mapComment14) : [],
});

export const parse192 = (post) => ({
    post: {
        author: {
            name: post.Name,
            username: post.Username,
            avatar: post.Avatar,
        },
        date: post.Date,
        text: post.Text,
        content_type: post.Content?.Type,
        content: post.Content && {
            file_name: post.Content.orig_name,
            file_size: post.Content.file_size ?? post.Content.Size,
            base64: post.Content.ImageB64 || post.Content.FileB64,
        },
        stats: {
            likes: post.LikesCount,
            dislikes: post.DislikesCount,
            comments: post.CommentsCount,
        },
    },
    comments: Array.isArray(post.Comments) ? post.Comments.map(mapComment14) : [],
});

export const parse21 = (post) => ({
    post: {
        author: {
            name: post.author_data.name,
            username: post.author_data.username,
            avatar: post.author_data.avatar,
        },
        date: post.date,
        text: post.text,
        content_type: post.content?.type,
        content: post.content && {
            file_name: post.content.orig_name,
            file_size: post.content.file_size ?? post.content.size,
            base64: post.content.file,
        },
        stats: {
            likes: post.likes_count,
            dislikes: post.dislikes_count,
            comments: post.comments_count,
        },
    },
    comments: Array.isArray(post.comments) ? post.comments.map(mapComment21) : [],
});

export const normalizeEPACK = (epack) => {
    switch (epack.E_VER) {
        case '1.4':
            return parse14(epack);
        case '1.9.2':
        case '1.9.4':
            return parse192(epack);
        case '2.1':
            return parse21(epack);
        default:
            console.warn('Неизвестная версия поста:', epack.E_VER);
            return null;
    }
};
