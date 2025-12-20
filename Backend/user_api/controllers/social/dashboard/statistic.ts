import { readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { Redis } from 'ioredis';
import { dbE } from '../../../../lib/db.js';

const redis = new Redis();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../storage');
const ROOT_PATH = process.platform === 'win32' ? 'C:' : '/';
const CACHE_KEY = 'storage_stats';
const CACHE_TTL_SECONDS = 120;

const getDiskSize = async () => {
    try {
        const mod = await import('check-disk-space');
        const checkDiskSpace = mod.default as unknown as (path: string) => Promise<{ size: number, free: number }>;
        const { size } = await checkDiskSpace(ROOT_PATH);
        return size;
    } catch (err) {
        console.error('check-disk-space error:', err);
        return null;
    }
}

const getFolderSize = async (folderPath) => {
    let totalSize = 0;

    try {
        const entries = await readdir(folderPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(folderPath, entry.name);
            if (entry.isFile()) {
                const fileStat = await stat(fullPath);
                totalSize += fileStat.size;
            } else if (entry.isDirectory()) {
                totalSize += await getFolderSize(fullPath);
            }
        }
    } catch (err) {
    }

    return totalSize;
}

const calculateSizes = async (paths, basePath = ROOT) => {
    for (const entry of paths) {
        const fullPath = path.join(basePath, entry.path);
        if (entry.paths) {
            await calculateSizes(entry.paths, fullPath);
            entry.size = entry.paths.reduce((sum, p) => sum + p.size, 0);
        } else {
            entry.size = await getFolderSize(fullPath);
        }
    }
    return paths;
}

const getStatistic = async () => {
    const statistic = {
        users: 0,
        posts: 0,
        comments: 0,
        likes: 0,
        dislikes: 0,
        songs: 0,
        notifications: 0
    };

    const query = `
        SELECT
            (SELECT COUNT(*) FROM accounts) AS users_count,
            (SELECT COUNT(*) FROM songs) AS songs_count,
            (SELECT COUNT(*) FROM notifications) AS notifications_count,
            (SELECT COUNT(*) FROM posts) AS posts_count,
            (SELECT COUNT(*) FROM post_likes) AS likes_count,
            (SELECT COUNT(*) FROM post_dislikes) AS dislikes_count,
            (SELECT COUNT(*) FROM comments) AS comments_count
    `;

    try {
        const [row] = await dbE.query(query);

        statistic.users = row.users_count || 0;
        statistic.posts = row.posts_count || 0;
        statistic.comments = row.comments_count || 0;
        statistic.likes = row.likes_count || 0;
        statistic.dislikes = row.dislikes_count || 0;
        statistic.songs = row.songs_count || 0;
        statistic.notifications = row.notifications_count || 0;

        return statistic;
    } catch (err) {
        console.error('Failed to load statistics:', err);
        return statistic;
    }
};

const statistic = async () => {
    let paths = [
        {
            path: 'apps',
            size: 0,
            paths: [
                {
                    path: 'icons',
                    size: 0,
                }
            ]
        },
        {
            path: 'avatars',
            size: 0
        },
        {
            path: 'covers',
            size: 0
        },
        {
            path: 'posts',
            size: 0,
            paths: [
                {
                    path: 'images',
                    size: 0
                },
                {
                    path: 'files',
                    size: 0
                },
            ]
        },
        {
            path: 'comments',
            size: 0,
            paths: [
                {
                    path: 'images',
                    size: 0
                },
                {
                    path: 'videos',
                    size: 0
                },
                {
                    path: 'files',
                    size: 0
                }
            ]
        },
        {
            path: 'messenger',
            size: 0,
            paths: [
                {
                    path: 'avatars',
                    size: 0
                },
                {
                    path: 'pools',
                    size: 0
                }
            ]
        },
        {
            path: 'music',
            size: 0
        },
        {
            path: 'simple',
            size: 0
        },
        {
            path: 'temp',
            size: 0
        },
    ]

    const cached = await redis.get(CACHE_KEY);

    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            return RouterHelper.success(parsed);
        } catch (err) {
            console.error('Failed to parse cached data:', err);
        }
    }

    const statistic = await getStatistic();
    const storage = await calculateSizes(paths);
    const storage_space = await getDiskSize();

    const result = { storage, storage_space, statistic };

    await redis.set(CACHE_KEY, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);

    return RouterHelper.success(result);
}

export default statistic;
