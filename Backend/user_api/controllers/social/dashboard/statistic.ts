import { readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { dbE } from '../../../../lib/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../storage');
const ROOT_PATH = process.platform === 'win32' ? 'C:' : '/';
const CACHE_KEY = 'storage_stats';
const CACHE_TTL_SECONDS = 120;

// Заглушка для Redis
class RedisStub {
  constructor() {
    console.log('📦 RedisStub для statistic.ts');
  }
  
  async get(key: string) {
    console.log(`📦 RedisStub.get("${key}") -> null`);
    return null;
  }
  
  async set(key: string, value: any, mode?: string, duration?: number) {
    console.log(`📦 RedisStub.set("${key}") -> OK`);
    return 'OK';
  }
  
  async del(key: string) {
    console.log(`📦 RedisStub.del("${key}") -> 1`);
    return 1;
  }
  
  async expire(key: string, seconds: number) {
    console.log(`📦 RedisStub.expire("${key}", ${seconds}) -> 1`);
    return 1;
  }
  
  async quit() {
    console.log('📦 RedisStub.quit() -> OK');
    return 'OK';
  }
}

const redis = new RedisStub();

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
        // Игнорируем ошибки доступа
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
        // Возвращаем нулевые значения в режиме заглушки
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
    ];

    // В режиме без Redis всегда пропускаем кэш
    console.log('📦 Redis отключен, пропускаем кэширование');

    const statisticData = await getStatistic();
    const storage = await calculateSizes(paths);
    const storage_space = await getDiskSize();

    const result = { 
        storage, 
        storage_space, 
        statistic: statisticData 
    };

    return RouterHelper.success(result);
}

export default statistic;
