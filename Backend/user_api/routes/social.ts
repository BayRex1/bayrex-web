import { goldActivate, goldPay } from '../controllers/social/gold.js';
import { getOnlineUsers } from '../controllers/social/info.js';
import { addLink, deleteLink, editLink } from '../controllers/social/links.js';
import { loadSong, loadSongs } from '../controllers/social/music.js';
import { loadPost, loadPosts } from '../controllers/social/posts.js';
import { blockProfile, getProfile, unblockProfile } from '../controllers/social/profile.js';
import { search } from '../controllers/social/search.js';
import AppError from '../../services/system/AppError.js';
import change_profile from '../controllers/social/change_profile/index.js';
import auth from '../controllers/social/auth/index.js';
import profile from '../controllers/social/profile/index.js';
import channels from '../controllers/social/channels/index.js';
import music from '../controllers/social/music/index.js';
import notifications from '../controllers/social/notifications/index.js';
import posts from '../controllers/social/posts/index.js';
import comments from '../controllers/social/comments/index.js';
import eball from '../controllers/social/eball/index.js';
import dashboard from '../controllers/social/dashboard/index.js';
import notify from '../controllers/social/notify/index.js';
import gifts from '../controllers/social/gifts/index.js';
import moderation from '../controllers/social/moderation/index.js';
import loadModerationHistory from '../controllers/social/moderation/load_moderation_history.js';
import { submitAppeal, loadMyAppeals, checkExisting, loadAdminAppeals, reviewAppeal, updateAppealStatus } from '../controllers/social/appeals/index.js';

// ⭐ ИСПРАВЛЕННЫЙ ПУТЬ ИМПОРТА ⭐
import { reg } from '../../controllers/auth/reg.js';

const routes = {
    // ⭐ ДОБАВЛЕНО: Роуты для authorization ⭐
    authorization: {
        register: { h: reg, useAccount: false }
    },
    
    auth: {
        login: { h: auth.login, useAccount: false },
        reg: { h: auth.reg, useAccount: false },
        sessions: {
            load: { h: auth.sessions.load, useAccount: true },
            delete: { h: auth.sessions.delete, useAccount: true },
        }
    },
    channels: {
        create: { h: channels.create, useAccount: true },
        change: {
            avatar: {
                upload: { h: channels.change.avatar.upload, useAccount: true },
                delete: { h: channels.change.avatar.delete, useAccount: true },
            },
            cover: {
                upload: { h: channels.change.cover.upload, useAccount: true },
                delete: { h: channels.change.cover.delete, useAccount: true },
            },
            name: { h: channels.change.name, useAccount: true },
            username: { h: channels.change.username, useAccount: true },
            description: { h: channels.change.description, useAccount: true },
        }
    },
    get_online_users: { h: getOnlineUsers, useAccount: false },
    search: { h: search, useAccount: true },
    add_link: { h: addLink, useAccount: true },
    delete_link: { h: deleteLink, useAccount: true },
    edit_link: { h: editLink, useAccount: true },
    get_profile: { h: getProfile, useAccount: false },
    block_profile: { h: blockProfile, useAccount: true },
    unblock_profile: { h: unblockProfile, useAccount: true },
    load_post: { h: loadPost, useAccount: false },
    load_posts: { h: loadPosts, useAccount: true },
    notifications: {
        load: { h: notifications.load, useAccount: true },
        view: { h: notifications.view, useAccount: true }
    },
    profile: {
        subscribe: { h: profile.subscribe, useAccount: true },
        load_subscribers: { h: profile.load_subscribers, useAccount: true },
        load_subscriptions: { h: profile.load_subscriptions, useAccount: true }
    },
    posts: {
        add: { h: posts.add, useAccount: true },
        like: { h: posts.like, useAccount: true },
        dislike: { h: posts.dislike, useAccount: true },
        delete: { h: posts.delete, useAccount: true }
    },
    comments: {
        load: { h: comments.load, useAccount: false },
        add: { h: comments.add, useAccount: true },
        delete: { h: comments.delete, useAccount: true }
    },
    gold_pay: { h: goldPay, useAccount: true },
    gold_activate: { h: goldActivate, useAccount: true },
    load_songs: { h: loadSongs, useAccount: false },
    load_song: { h: loadSong, useAccount: false },
    eball: {
        hall: {
            load: { h: eball.hall.load, useAccount: true },
        },
        send: { h: eball.send, useAccount: true },
        load_history: { h: eball.load_history, useAccount: true }
    },
    change_profile: {
        avatar: {
            upload: { h: change_profile.upload_avatar, useAccount: true },
            delete: { h: change_profile.delete_avatar, useAccount: true },
        },
        cover: {
            upload: { h: change_profile.upload_cover, useAccount: true },
            delete: { h: change_profile.delete_cover, useAccount: true },
        },
        name: { h: change_profile.name, useAccount: true },
        username: { h: change_profile.username, useAccount: true },
        description: { h: change_profile.description, useAccount: true },
        email: { h: change_profile.email, useAccount: true },
        password: { h: change_profile.password, useAccount: true },
    },
    music: {
        upload: { h: music.upload, useAccount: true },
        like: { h: music.like, useAccount: true },
        load_library: { h: music.load_library, useAccount: true },
        playlists: {
            load: { h: music.playlists.load, useAccount: true },
            create: { h: music.playlists.create, useAccount: true },
            add: { h: music.playlists.add, useAccount: true },
            remove: { h: music.playlists.remove, useAccount: true },
            delete: { h: music.playlists.delete, useAccount: true }
        }
    },
    dashboard: {
        statistic: { h: dashboard.statistic, useAccount: true },
        users: {
            load: { h: dashboard.users.load, useAccount: true, permission: 'Admin' },
            change_password: { h: dashboard.users.change_password, useAccount: true, permission: 'Admin' },
        },
        gold: {
            load_statistic: { h: dashboard.gold.load_statistic, useAccount: true },
            generate_code: { h: dashboard.gold.generate_code, useAccount: true, permission: 'Admin' },
            load_codes: { h: dashboard.gold.load_codes, useAccount: true, permission: 'Admin' },
            recount_users: { h: dashboard.gold.recount_users, useAccount: true, permission: 'Admin' }
        },
        gifts: {
            add: { h: dashboard.gifts.add, useAccount: true, permission: 'Admin' },
            edit: { h: dashboard.gifts.edit, useAccount: true, permission: 'Admin' },
            delete: { h: dashboard.gifts.delete, useAccount: true, permission: 'Admin' }
        }
    },
    gifts: {
        send: { h: gifts.send, useAccount: true },
        load: { h: gifts.load, useAccount: true }
    },
    notify: {
        push_sub: { h: notify.push_sub, useAccount: true }
    },
    moderation: {
        send_report: { h: moderation.send_report, useAccount: true },
        load_reports: { h: moderation.load_reports, useAccount: true, permission: 'Admin' },
        update_report: { h: moderation.update_report, useAccount: true, permission: 'Admin' },
        load_comments: { h: moderation.load_comments, useAccount: true, permission: 'Admin' },
        load_posts: { h: moderation.load_posts, useAccount: true, permission: 'Admin' },
        delete_post: { h: moderation.delete_post, useAccount: true, permission: 'Admin' },
        delete_comment: { h: moderation.delete_comment, useAccount: true, permission: 'Admin' },
        apply_punishment: { h: moderation.apply_punishment, useAccount: true, permission: 'Admin' },
        get_user_permissions: { h: moderation.get_user_permissions, useAccount: true, permission: 'Admin' },
        update_user_permissions: { h: moderation.update_user_permissions, useAccount: true, permission: 'Admin' },
        load_my_reports: { h: moderation.load_my_reports, useAccount: true },
        load_history: { h: loadModerationHistory, useAccount: true, permission: 'Admin' },
        dashboard_stats: { h: moderation.dashboard_stats, useAccount: true, permission: 'Admin' }
    },
    appeals: {
        submit: { h: submitAppeal, useAccount: true },
        load_my: { h: loadMyAppeals, useAccount: true },
        check_existing: { h: checkExisting, useAccount: true },
        load_admin: { h: loadAdminAppeals, useAccount: true, permission: 'Admin' },
        review: { h: reviewAppeal, useAccount: true, permission: 'Admin' },
        update_status: { h: updateAppealStatus, useAccount: true, permission: 'Admin' }
    }
};

const flatRoutes = new Map();

const flattenRoutes = (obj, path = '') => {
    for (const key in obj) {
        const value = obj[key];
        const newPath = path ? `${path}/${key}` : key;

        if (value && typeof value.h === 'function') {
            flatRoutes.set(newPath, value);
        } else if (typeof value === 'object' && value !== null) {
            flattenRoutes(value, newPath);
        }
    }
};

flattenRoutes(routes);

console.log('✅ Social.ts загружен с маршрутом authorization/register');

const social = async (ws, action, data) => {
    try {
        const route = flatRoutes.get(action);

        if (!route) {
            return { status: 'error', message: 'Такого действия нет' };
        }

        if (route.useAccount && !ws?.account?.ID) {
            return { status: 'error', message: 'Вы не вошли в аккаунт' };
        }

        if (route.permission && !ws?.account?.permissions?.[route.permission]) {
            return { status: 'error', message: 'У вас нет прав на это действие' };
        }

        const result = await route.h({ account: ws.account, data });

        return { action, ...result };
    } catch (error) {
        console.log(error);

        if (error instanceof AppError) {
            return { status: 'error', message: error.message };
        }
        return {
            status: 'error',
            message: 'Внутренняя ошибка сервера'
        };
    }
};

export default social;
