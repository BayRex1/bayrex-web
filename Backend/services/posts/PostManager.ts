import { fileTypeFromBuffer } from 'file-type';
import { getDate } from '../../system/global/Function.js';
import AccountDataHelper from '../account/AccountDataHelper.js';
import RouterHelper from '../system/RouterHelper.js';
import AccountManager from '../account/AccountManager.js';
import Validator from '../system/Validator.js';
import FileManager from '../system/FileManager.js';
import ImageEngine from '../system/ImageEngine.js';
import { FFmpegInspector } from '../../system/global/FFmpegInspector.js';
import AppError from '../system/AppError.js';
import { dbE } from '../../lib/db.js';
import { basename, extname } from 'node:path';

const validImageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
const imageEngine = new ImageEngine();

class PostManager {
    static create = async ({ account, payload }) => {
        const accountManager = new AccountManager(account.ID);
        const currentPermissions = await accountManager.getPermissions();

        if (!currentPermissions || !currentPermissions.Posts) {
            const activePunishment = await dbE.query(`
                SELECT reason, punishment_type, end_date 
                FROM accounts_punishments 
                WHERE user_id = ? AND punishment_type IN ('restrict_posts', 'ban') AND is_active = 1
                ORDER BY start_date DESC 
                LIMIT 1
            `, [account.ID]);

            if (activePunishment && activePunishment.length > 0) {
                const punishment = activePunishment[0];
                const punishmentText = punishment.punishment_type === 'ban' ? 'заблокирован' : 'ограничены посты';
                const reason = punishment.reason || 'Причина не указана';
                const endDate = punishment.end_date ?
                    new Date(punishment.end_date).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : '';

                const message = `У вас ${punishmentText}. Причина: ${reason}` +
                    (endDate ? `. До: ${endDate}` : '');

                return RouterHelper.error(message);
            } else {
                return RouterHelper.error('У вас ограничена возможность публикации постов');
            }
        }

        const isGold = await accountManager.getGoldStatus();
        const { text = '', files, type = 0, songs = 0, wall, from, settings } = payload || {};

        let sender = {
            id: account.ID,
            type: 0
        }

        if (from && from.id && from.type) {
            if (from.type === 1) {
                const channel = await dbE.query('SELECT * FROM `channels` WHERE `ID` = ? AND `Owner` = ?', [from.id, account.ID]);

                if (channel) {
                    sender = {
                        id: channel[0].ID,
                        type: 1
                    }
                } else {
                    return RouterHelper.error('Канал не найден');
                }
            }
        }

        const filesCount = files?.length || 0;
        const fileSizeLimit = isGold ? 50 * 1024 * 1024 : 20 * 1024 * 1024;

        if (!text && text.trim() === '' && filesCount < 1 && songs < 1) return RouterHelper.error('Нельзя отправить пустой пост');
        if (await this.checkTime({ id: sender.id, type: sender.type })) return RouterHelper.error('Отправить пост можно раз в 15 секунд');

        const validator = new Validator();

        if (text) {
            validator.validateText({
                title: 'Текст поста',
                value: text,
                maxLength: 30000
            });
        }

        let totalFileSize = 0;
        let contentType = 'text';
        let content: any = {};

        if (files && files?.length > 150) {
            return RouterHelper.error('Можно добавить не более 150 файлов');
        }

        if (filesCount > 0) {
            if (filesCount > 150) return RouterHelper.error('Максимальное количество файлов 150');

            contentType = await this.getFilesType(files);

            for (const file of files) {
                totalFileSize += file.buffer.length;
                if (totalFileSize > fileSizeLimit) break;
            }

            if (totalFileSize > fileSizeLimit)
                return isGold
                    ? RouterHelper.error('Размер файлов не должен превышать 50 MB.')
                    : RouterHelper.error('Размер файлов не должен превышать 20 MB, вы можете увеличить лимит до 50 MB, купив подписку Gold.');
        }

        let c_images = [];
        let c_videos = [];
        let c_files = [];

        if (songs && songs?.length > 0) {
            for (const song of songs) {
                const s = await dbE.query('SELECT * FROM songs WHERE id = ?', [song]);
                if (s.length === 0) {
                    throw new AppError(`Трек ${song} не найден`);
                } else {
                    if (!content.songs) content.songs = [];
                    content.songs.push({
                        song_id: song
                    })
                }
            }
        }

        if (files && files?.length > 0) {
            for (const file of files) {
                const fileType = await fileTypeFromBuffer(file.buffer);

                if (fileType?.mime.startsWith('image/')) {
                    c_images.push({
                        buffer: file.buffer,
                        name: file.name
                    });
                } else if (fileType?.mime.startsWith('video/')) {
                    const safeName = this.sanitizeFileName(file.name);
                    const ffmpegInspector = new FFmpegInspector(file.buffer, safeName);
                    const metadata = await ffmpegInspector.getMetadata();

                    if (!metadata || !metadata.width || !metadata.height) {
                        c_files.push({
                            buffer: file.buffer,
                            name: file.name
                        });
                    } else {
                        c_videos.push({
                            buffer: file.buffer,
                            name: file.name,
                            metadata: metadata
                        });
                    }
                } else {
                    c_files.push({
                        buffer: file.buffer,
                        name: file.name
                    });
                }
            }

            if (c_images.length > 0) {
                for (const image of c_images) {
                    const file = await imageEngine.create({
                        file: image.buffer,
                        path: 'posts/images',
                        simpleSize: 900,
                        preview: true
                    });

                    if (file) {
                        if (!content.images) content.images = [];

                        content.images.push({
                            img_data: file,
                            file_name: image.name,
                            file_size: image.buffer.length
                        });
                    }
                }
            }

            if (c_videos.length > 0) {
                for (const video of c_videos) {
                    const uploadedFile = await FileManager.saveFile('posts/videos', video.buffer);

                    if (uploadedFile) {
                        if (!content.videos) content.videos = [];

                        content.videos.push({
                            file: uploadedFile,
                            name: video.name,
                            size: video.buffer.length,
                            info: {
                                width: video.metadata.width,
                                height: video.metadata.height
                            }
                        });
                    }
                }
            }


            if (c_files.length > 0) {
                for (const file of c_files) {
                    const uploadedFile = await FileManager.saveFile('posts/files', file.buffer);

                    if (uploadedFile) {
                        if (!content.files) content.files = [];

                        content.files.push({
                            file: uploadedFile,
                            name: file.name,
                            size: file.buffer.length
                        });
                    }
                }
            }
        }

        if (settings?.censoring_img) {
            content.censoring = true;
        }

        const res = await dbE.query('INSERT INTO `posts` (`author_id`, `author_type`, `content_type`, `text`, `content`, `date`) VALUES (?, ?, ?, ?, ?, ?)', [
            sender.id,
            sender.type,
            contentType,
            text,
            content ? JSON.stringify(content) : null,
            getDate()
        ])

        if (type === 'wall' && wall && wall.username) {
            const profileData = await AccountDataHelper.getDataFromUsername(wall.username);

            if (profileData && profileData.id !== undefined && profileData.type !== undefined) {
                await dbE.query('INSERT INTO `wall` (`author_id`, `author_type`, `pid`) VALUES (?, ?, ?)', [profileData.id, profileData.type, res.insertId]);
                await dbE.query('UPDATE `posts` SET `hidden` = 1 WHERE `id` = ?', [res.insertId]);
            }
        }

        await accountManager.maybeReward('post');
        await this.recount(sender.id, sender.type);

        return RouterHelper.success({ post_id: res.insertId })
    }

    static sanitizeFileName(name: string): string {
        const base = basename(name, extname(name));
        const safe = base.replace(/[^a-zA-Z0-9_-]/g, '');
        return safe.length > 0 ? `${safe}${extname(name)}` : `video_${Date.now()}.mp4`;
    }

    static async getFilesType(
        files: { name: string, type: string, size: number, buffer: Uint8Array }[]
    ): Promise<'images' | 'files' | 'mixed'> {
        let hasImage = false;
        let hasFile = false;

        for (const file of files) {
            const buffer = Buffer.from(file.buffer);
            const type = await fileTypeFromBuffer(buffer);

            if (type && validImageTypes.includes(type.mime)) {
                hasImage = true;
            } else {
                hasFile = true;
            }

            if (hasImage && hasFile) return 'mixed';
        }

        if (hasImage) return 'images';
        if (hasFile) return 'files';

        return 'files';
    };

    static async recount(author_id, author_type) {
        if (author_type === 0) {
            const posts = await dbE.query('SELECT COUNT(*) AS count FROM posts WHERE author_id = ? AND author_type = 0 AND hidden = 0', [author_id]);
            await dbE.query('UPDATE accounts SET Posts = ? WHERE ID = ?', [posts[0].count, author_id]);
        } else if (author_type === 1) {
            const posts = await dbE.query('SELECT COUNT(*) AS count FROM posts WHERE author_id = ? AND author_type = 1 AND hidden = 0', [author_id]);
            await dbE.query('UPDATE channels SET Posts = ? WHERE ID = ?', [posts[0].count, author_id]);
        }
    }

    static async moveToTrash({ account, pid }) {
        const postResult = await dbE.query('SELECT author_id, author_type FROM posts WHERE id = ?', [pid]);
        const post = postResult?.[0];

        const canManageAny = !!account?.permissions?.Admin || !!account?.permissions?.Moderator;

        if (!canManageAny) {
            if (post.author_type === 0) {
                if (Number(post.author_id) !== Number(account.ID)) {
                    return RouterHelper.error('Вы не владелец этого поста');
                }
            } else if (post.author_type === 1) {
                const channelResult = await dbE.query(
                    'SELECT Owner FROM channels WHERE ID = ?',
                    [post.author_id]
                );
                const channel = channelResult?.[0];
                if (!channel) {
                    return RouterHelper.error('Канал не найден');
                }
                if (Number(channel.Owner) !== Number(account.ID)) {
                    return RouterHelper.error('Вы не владелец этого поста');
                }
            } else {
                return RouterHelper.error('Неверный тип автора');
            }
        }

        await dbE.query(
            'UPDATE posts SET in_trash = 1, deleted_at = ? WHERE id = ?',
            [getDate(), pid]
        );

        return RouterHelper.success({
            message: 'Пост успешно удален'
        });
    }

    static async checkTime(from) {
        const rows = await dbE.query(
            'SELECT * FROM `posts` WHERE `author_id` = ? AND `author_type` = ? ORDER BY `date` DESC LIMIT 1',
            [from.id, from.type]
        );

        if (rows.length > 0) {
            const timeLimit = 15;
            const lastPostTime = new Date(rows[0].date).getTime() / 1000;
            const currentTime = Math.floor(Date.now() / 1000);
            const elapsedTime = currentTime - lastPostTime;

            return elapsedTime < timeLimit;
        }
    }
}

export default PostManager;