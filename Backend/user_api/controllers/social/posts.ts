import { dbE } from '../../../lib/db.js';
import AccountDataHelper from '../../../services/account/AccountDataHelper.js';
import PostDataHelper from '../../../services/posts/PostsDataHelper.js';
import RouterHelper from '../../../services/system/RouterHelper.js';

const handleContent = async (content) => {
    if (!content || typeof content !== 'object') return null;

    if (Array.isArray(content.songs)) {
        content.songs = await Promise.all(
            content.songs.map(async (song) => {
                const songData = await dbE.query(
                    'SELECT * FROM `songs` WHERE `id` = ? LIMIT 1',
                    [song.song_id]
                );

                const songRow = songData[0] || {};

                return {
                    id: song.song_id,
                    title: songRow.title ?? null,
                    artist: songRow.artist ?? null,
                    album: song.album,
                    cover: songRow.cover ? songRow.cover : null,
                    file: song.file,
                    duration: songRow.duration ?? null
                };
            })
        );
    }

    return content;
};

const handlePost = async (post, account) => {
    let myPost = false;

    const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;
    const deleted = post.in_trash === 1 && canViewTrash;

    const accountDataHelper = new AccountDataHelper();
    const postDataHelper = new PostDataHelper(post.id);
    const author = await accountDataHelper.getAuthorDataFromPost(post.id);
    const userIcons = [];
    const isBlocked = account
        ? await accountDataHelper.checkBlock(account.ID, post.author_id, post.author_type)
        : false;

    if (!author) return;

    if (account) {
        if (parseInt(author.type) === 0 && author.data.ID === account.ID) myPost = true;
        if (parseInt(author.type) === 1 && author.data.Owner === account.ID) myPost = true;
    }

    if (parseInt(author.type) === 0) {
        userIcons.push(...(await accountDataHelper.getIcons(author.data.ID)));
    }

    const getContent = async () => {
        const content = post.content || '{}';
        const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
        return await handleContent(parsedContent);
    };

    return {
        id: post.id,
        author: {
            id: author.data.ID,
            type: author.type,
            username: author.data.Username,
            name: author.data.Name,
            avatar: AccountDataHelper.getAvatar(author.data.Avatar),
            icons: userIcons,
            blocked: isBlocked
        },
        text: post.text,
        content: await getContent(),
        create_date: post.date,
        likes: post.likes,
        dislikes: post.dislikes,
        ...(account
            ? {
                liked: await postDataHelper.postLiked(account.ID),
                disliked: await postDataHelper.postDisliked(account.ID)
            }
            : { liked: false, disliked: false }),
        comments: post.comments,
        my_post: myPost,
        ...(deleted && { deleted: true }),
    };
};

const loadPostsProfile = async ({ account, authorID, authorType, start_index }) => {
    const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;

    const posts = await dbE.query(
        `SELECT *
           FROM posts
          WHERE author_id   = ?
            AND author_type = ?
            AND hidden      = 0
            ${!canViewTrash ? 'AND in_trash = 0' : ''}
          ORDER BY date DESC
          LIMIT ?, 25`,
        [authorID, authorType, start_index]
    );

    try {
        const handledPosts = await Promise.all(
            posts.map(post => handlePost(post, account))
        );
        return RouterHelper.success({ posts: handledPosts });
    } catch (error) {
        console.error('Ошибка при обработке постов:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};

const loadPostsSub = async ({ account, start_index }) => {
    const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;

    const posts = await dbE.query(
        `SELECT posts.*
           FROM posts
           JOIN subscriptions
             ON posts.author_id   = subscriptions.Target
            AND posts.author_type = subscriptions.TargetType
          LEFT JOIN accounts
             ON posts.author_id   = accounts.ID
            AND posts.author_type = 0
          LEFT JOIN channels
             ON posts.author_id   = channels.ID
            AND posts.author_type = 1
          WHERE subscriptions.User = ?
            AND posts.hidden       = 0
            ${!canViewTrash ? 'AND posts.in_trash = 0' : ''}
          ORDER BY posts.date DESC
          LIMIT ?, 25`,
        [account.ID, start_index]
    );

    try {
        const handledPosts = await Promise.all(
            posts.map(post => handlePost(post, account))
        );
        return RouterHelper.success({ posts: handledPosts });
    } catch (error) {
        console.error('Ошибка при обработке постов:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};

const loadPostsRec = async ({ account, start_index }) => {
    const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;

    const posts = await dbE.query(
        `SELECT *
           FROM posts
          WHERE hidden = 0
          ${!canViewTrash ? 'AND in_trash = 0' : ''}
          ORDER BY RAND()
          LIMIT ?, 25`,
        [start_index]
    );

    try {
        const handledPosts = await Promise.all(posts.map(post => handlePost(post, account)));
        return RouterHelper.success({ posts: handledPosts });
    } catch (error) {
        console.error('Ошибка при обработке постов:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};

const loadPostsLast = async ({ account, start_index }) => {
    const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;

    const posts = await dbE.query(
        `SELECT p.*
           FROM posts p
      LEFT JOIN blocked b
             ON b.author_id = p.author_id
            AND b.author_type = p.author_type
            AND b.uid = ?
          WHERE p.hidden = 0
            AND b.author_id IS NULL
            ${!canViewTrash ? 'AND p.in_trash = 0' : ''}
       ORDER BY p.Date DESC
          LIMIT ?, 25`,
        [account.ID, start_index]
    );

    try {
        const handledPosts = await Promise.all(posts.map(post => handlePost(post, account)));
        return RouterHelper.success({ posts: handledPosts });
    } catch (error) {
        console.error('Ошибка при обработке постов:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};

const loadPostsWall = async ({ account, username, start_index }) => {
    const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;

    const authorData = await AccountDataHelper.getDataFromUsername(username);
    if (!authorData) return RouterHelper.error('Стенка не найдена');

    const wallPosts = await dbE.query(
        `SELECT posts.*
           FROM wall
     INNER JOIN posts
             ON wall.pid = posts.id
          WHERE wall.author_id = ?
            AND wall.author_type = ?
            ${!canViewTrash ? 'AND posts.in_trash = 0' : ''}
       ORDER BY posts.date DESC
          LIMIT ?, 25`,
        [authorData.id, authorData.type, start_index]
    );

    try {
        const posts = await Promise.all(wallPosts.map(post => handlePost(post, account)));
        return RouterHelper.success({ posts_type: 'wall', posts });
    } catch (error) {
        console.error('Ошибка при обработке постов стены:', error);
        return RouterHelper.error('Ошибка при загрузке постов');
    }
};


export const loadPost = async ({ account, data }) => {
    const postResult = await dbE.query(
        'SELECT * FROM `posts` WHERE `id` = ? LIMIT 1',
        [data.pid]
    );
    const post = postResult?.[0];

    if (!post?.id) {
        return RouterHelper.error('Пост не найден');
    }

    const canViewTrash = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;
    if (post.in_trash === 1 && !canViewTrash) {
        return RouterHelper.error('Пост не найден');
    }

    return RouterHelper.success({ post: await handlePost(post, account) });
};

export const loadPosts = async ({ account, data }) => {
    const { posts_type, author_id, author_type, start_index, username } = data.payload;

    switch (posts_type) {
        case 'profile':
            return await loadPostsProfile({
                account,
                authorID: author_id,
                authorType: author_type,
                start_index: start_index || 0
            });
        case 'subscribe':
            return await loadPostsSub({ account, start_index: start_index || 0 });
        case 'rec':
            return await loadPostsRec({ account, start_index: start_index || 0 });
        case 'last':
            return await loadPostsLast({ account, start_index: start_index || 0 });
        case 'wall':
            return await loadPostsWall({ account, username, start_index: start_index || 0 });
        default:
            return RouterHelper.error('Ошибка при выводе постов');
    }
};