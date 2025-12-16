import { dbE } from '../../../lib/db.js';
import AccountDataHelper from '../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../services/system/RouterHelper.js';

const users = async ({ value, start_index, limit }) => {
    const rows = await dbE.query('SELECT * FROM `accounts` WHERE (`Name` LIKE ?) OR (`Username` LIKE ?) ORDER BY `Subscribers` DESC LIMIT ?, ?', [
        `%${value}%`, `%${value}%`,
        start_index,
        limit
    ]);

    return rows.map((user) => ({
        id: user.ID,
        type: 'user',
        name: user.Name,
        username: user.Username,
        avatar: user.Avatar,
        subscribers: user.Subscribers,
        posts: user.Posts
    }));
};

const channels = async ({ value, start_index, limit }) => {
    const rows = await dbE.query('SELECT * FROM `channels` WHERE (`Name` LIKE ?) OR (`Username` LIKE ?) ORDER BY `Subscribers` DESC LIMIT ?, ?', [
        `%${value}%`, `%${value}%`,
        start_index,
        limit
    ]);

    return rows.map((channel) => ({
        id: channel.ID,
        type: 'channel',
        name: channel.Name,
        username: channel.Username,
        avatar: channel.Avatar,
        subscribers: channel.Subscribers,
        posts: channel.Posts
    }))
}

const posts = async ({ value, start_index, limit }) => {
    const rows = await dbE.query('SELECT * FROM `posts` WHERE ((`text` LIKE ?) OR (`content` LIKE ?)) LIMIT 25', [
        `%${value}%`, `%${value}%`,
        start_index,
        limit
    ]);

    const posts = [];

    for (const post of rows) {
        const accountDataHelper = new AccountDataHelper();
        const author = await accountDataHelper.getAuthorDataFromPost(post.id);

        if (author) {
            posts.push({
                id: post.id,
                type: 'post',
                author: {
                    id: author.data.ID,
                    username: author.data.Username,
                    name: author.data.Name,
                    avatar: author.data.Avatar
                },
                text: post.text,
                content: post.content,
                create_date: post.date
            });
        }
    }

    return posts;
}

const music = async ({ value, start_index, limit }) => {
    const rows = await dbE.query('SELECT * FROM `songs` WHERE (`title` LIKE ?) OR (`artist` LIKE ?) ORDER BY `title` DESC LIMIT 25', [
        `%${value}%`, `%${value}%`,
        start_index,
        limit
    ]);

    return rows.map((song) => ({
        id: song.id,
        type: 'song',
        title: song.title,
        artist: song.artist,
        cover: song.cover
    }))
}

const all = async ({ value, start_index, limit }) => {
    const si = Math.floor(start_index / 4); 
    const l = Math.floor(limit / 4);
    const result = [];

    const usersResult = await users({ value, start_index: si, limit: l });
    result.push(...usersResult);
    const channelsResult = await channels({ value, start_index: si, limit: l });
    result.push(...channelsResult);
    const postsResult = await posts({ value, start_index: si, limit: l });
    result.push(...postsResult);
    const musicResult = await music({ value, start_index: si, limit: l });
    result.push(...musicResult);

    return result;
}

const index = async ({ category, value, start_index, limit }) => {
    switch (category) {
        case 'all': {
            return await all({ value, start_index: start_index || 0, limit });
        }
        case 'users': {
            return await users({ value, start_index: start_index || 0, limit });
        }
        case 'channels': {
            return await channels({ value, start_index: start_index || 0, limit });
        }
        case 'posts': {
            return await posts({ value, start_index: start_index || 0, limit });
        }
        case'music': {
            return await music({ value, start_index: start_index || 0, limit });
        }
        default: {
            return await all({ value, start_index: start_index || 0, limit });
        }
    }
}

const search = async ({ data }) => {
    const results = await index({ 
        category: data.category, 
        value: data.value, 
        start_index: data.start_index, 
        limit: 25 
    });

    return RouterHelper.success({
        results: results
    })
}

export { search };