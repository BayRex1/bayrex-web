import { dbE } from '../../../lib/db.js';

export const getUpdates = async ({ data }) => {
    const type = data.updates_type || 'release';
    const updates = await dbE.query('SELECT * FROM updates WHERE type = ? ORDER BY id DESC', [type]);

    return {
        updates_type: type,
        updates: Array.isArray(updates) ? updates.map((update) => ({
            id: update.id,
            type: update.type,
            version: update.version,
            content: JSON.parse(update.content)
        })) : []
    };
}

export const getLastUsers = async () => {
    const users = await dbE.query("SELECT * FROM `accounts` WHERE `avatar` != 'None' ORDER BY `CreateDate` DESC LIMIT 5");

    return {
        users: Array.isArray(users) ? users.map((user) => ({
            id: user.ID,
            name: user.Name,
            username: user.Username,
            avatar: user.Avatar
        })) : []
    };
}

export const getGoldUsers = async () => {
    const users = await dbE.query("SELECT sg.*, a.ID as ID, a.Name as Name, a.Username as Username, a.Avatar as Avatar, a.Posts as Posts, a.Subscribers as Subscribers FROM `gold_subs` sg  INNER JOIN `accounts` a ON sg.uid = a.ID WHERE sg.status = 1 ORDER BY `date` DESC");

    return {
        users: Array.isArray(users) ? users.map((user) => ({
            id: user.ID,
            name: user.Name,
            username: user.Username,
            avatar: user.Avatar,
            posts: user.Posts,
            subscribers: user.Subscribers
        })) : []
    };
}
