import { dbE } from '../../lib/db.js';
import Config from '../../system/global/Config.js';
import { getDate } from '../../system/global/Function.js';
import AccountManager from '../account/AccountManager.js';
import Validator from '../system/Validator.js';

class MusicManager {
    private accountData: any;
    private accountManager: AccountManager;
    private initPromise: Promise<void>;

    constructor(uid) {
        this.accountData = {};
        this.accountManager = new AccountManager(uid);
        this.initPromise = this.init();
    }

    private async loadAccountData(): Promise<void> {
        this.accountData = await this.accountManager.getAccountData();
    }

    private async init(): Promise<void> {
        await this.loadAccountData();
    }

    public async ensureInitialized(): Promise<void> {
        await this.initPromise;
    }

    private async withInit<T>(fn: () => Promise<T>): Promise<T> {
        await this.ensureInitialized();
        return fn();
    }

    async handleSong(song) {
        return {
            id: song.id,
            title: song.title,
            artist: song.artist,
            album: song.album,
            cover: song.cover,
            file: song.file,
            type: 0,
            duration: song.duration,
            date_added: song.date_added,
            liked: await this.isLiked(song.id, 0)
        };
    }

    async loadFavorites() {
        const favorites = await dbE.query('SELECT * FROM `music_likes` JOIN `songs` ON songs.id = music_likes.target_id WHERE music_likes.uid = ? AND type = 0 ORDER BY `date` DESC', [this.accountData?.ID]);
        const handledFavorites = await Promise.all(
            favorites.map(favorite => this.handleSong(favorite))
        );

        return {
            status: 'success',
            songs: handledFavorites
        }
    }

    async loadLatest(start_index) {
        const songs = await dbE.query('SELECT * FROM `songs` ORDER BY `date_added` DESC LIMIT ?, 25', [start_index]);
        const handledSongs = await Promise.all(
            songs.map(song => this.handleSong(song))
        );

        return {
            status: 'success',
            songs: handledSongs
        }
    }

    async loadRandom(start_index) {
        const songs = await dbE.query('SELECT * FROM `songs` ORDER BY RAND() DESC LIMIT ?, 25', [start_index]);
        const handledSongs = await Promise.all(
            songs.map(song => this.handleSong(song))
        );

        return {
            status: 'success',
            songs: handledSongs
        }
    }

    async loadSongs(data) {
        return this.withInit(async () => {
            switch (data.songs_type) {
                case 'favorites': {
                    return await this.loadFavorites();
                }
                case 'latest': {
                    return await this.loadLatest(data.start_index || 0);
                }
                case 'random': {
                    return await this.loadRandom(data.start_index || 0);
                }
                default: {
                    return { status: 'error', message: 'Категория не выбрана' };
                }
            }
        })
    }

    async loadSong(id) {
        return this.withInit(async () => {
            const song = await dbE.query('SELECT * FROM `songs` WHERE `id` = ?', [id]);

            if (!song.length) {
                return { status: 'error', message: 'Песня не найдена' };
            }

            return {
                status: 'success',
                song: {
                    id: song[0].id,
                    title: song[0].title,
                    artist: song[0].artist,
                    cover: song[0].cover,
                    file: song[0].file,
                    album: song[0].album,
                    genre: song[0].genre,
                    track_number: song[0].track_number,
                    release_year: song[0].release_year,
                    composer: song[0].composer,
                    duration: Number(song[0].duration),
                    bitrate: song[0].bitrate,
                    audio_format: song[0].audio_format,
                    date_added: song[0].date_added,
                    liked: await this.isLiked(song[0].id, 0)
                }
            };
        })
    }

    async createPlaylist(name, description, privacy) {
        return this.withInit(async () => {
            const validator = new Validator();

            try {
                validator.validateText({
                    title: 'Название',
                    value: name,
                    maxLength: 60
                });
                if (description) {
                    validator.validateText({
                        title: 'Описание',
                        value: description,
                        maxLength: 1000
                    });
                }
            } catch (error) {
                return { status: 'error', message: error.message };
            }

            if (privacy !== 0 && privacy !== 1) {
                throw new Error('Неверный тип плейлиста. Допустимо: 0 (публичный), 1 (приватный)');
            }

            const canCreate = await this.checkPlaylistsCount();

            if (!canCreate) {
                return { status: 'error', message: `Нельзя создать более ${Config.LIMITS.MAX_PLAYLISTS} плейлистов` };
            }

            const playlist = await dbE.query('INSERT INTO `playlists` (`name`, `description`, `cover`, `owner`, `privacy`, `create_date`) VALUES (?, ?, ?, ?, ?, ?)', [
                name,
                description,
                null,
                this.accountData.ID,
                privacy,
                getDate()
            ]);

            this.like(playlist.insertId, 1);

            return {
                status: 'success',
                playlist_id: playlist.insertId
            }
        })
    }

    async like(id, type = 0) {
        return this.withInit(async () => {
            if (type === 0) {
                const song = await dbE.query('SELECT * FROM `songs` WHERE `id` = ?', [id]);

                if (!song.length) {
                    return { status: 'error', message: 'Песня не найдена' };
                }
            } else {
                const playlist = await dbE.query('SELECT * FROM `playlists` WHERE `id` = ?', [id]);

                if (!playlist.length) {
                    return { status: 'error', message: 'Плейлист не найден' };
                }
            }

            const like = await dbE.query('SELECT * FROM `music_likes` WHERE `uid` = ? AND `target_id` = ? AND `type` = ?', [this.accountData.ID, id, type]);

            if (like.length > 0) {
                await dbE.query('DELETE FROM `music_likes` WHERE `uid` = ? AND `target_id` = ? AND `type` = ?', [this.accountData.ID, id, type]);
                return { status: 'success', message: 'Убрано из избранного' };
            } else {
                await dbE.query('INSERT INTO `music_likes` (`uid`, `target_id`, `type`, `date`) VALUES (?, ?, ?, ?)', [this.accountData.ID, id, type, getDate()]);
                return { status: 'success', message: 'Добавлено в избранное' };
            }
        })
    }

    async moveToTrash(id) {
        return this.withInit(async () => {
            const song = await dbE.query('SELECT id FROM `songs` WHERE `id` = ?', [id]);

            if (!song.length) {
                return { status: 'error', message: 'Песня не найдена' };
            }

            await dbE.query('UPDATE `songs` SET `in_trash` = 1, `deleted_at` = ? WHERE `id` = ?', [getDate(), id]);

            return { status: 'success', message: 'Песня перемещена в корзину' };
        })
    }

    async deletePlaylist(id: number) {
        return this.withInit(async () => {
            const rows = await dbE.query('SELECT * FROM playlists WHERE id = ?', [id]);
            if (!rows.length) {
                return { status: 'error', message: 'Плейлист не найден' };
            }
            const playlist = rows[0];
            if (playlist.owner !== this.accountData.ID) {
                return { status: 'error', message: 'Нет прав на удаление этого плейлиста' };
            }

            await dbE.query('DELETE FROM playlists_songs WHERE playlist_id = ?', [id]);
            await dbE.query('DELETE FROM music_likes WHERE target_id = ? AND type = 1', [id]);
            await dbE.query('DELETE FROM playlists WHERE id = ?', [id]);

            return { status: 'success', message: 'Плейлист удалён' };
        });
    }

    async addTrackToPlaylist(playlistId: number, songId: number) {
        return this.withInit(async () => {
            const pRows = await dbE.query('SELECT * FROM playlists WHERE id = ?', [playlistId]);

            if (!pRows.length) {
                return { status: 'error', message: 'Плейлист не найден' };
            }
            if (pRows[0].owner !== this.accountData.ID) {
                return { status: 'error', message: 'Нет прав на изменение этого плейлиста' };
            }

            const sRows = await dbE.query('SELECT id FROM songs WHERE id = ?', [songId]);
            if (!sRows.length) {
                return { status: 'error', message: 'Песня не найдена' };
            }

            const exists = await dbE.query(
                'SELECT * FROM playlists_songs WHERE playlist_id = ? AND song_id = ?',
                [playlistId, songId]
            );
            if (exists.length) {
                return { status: 'error', message: 'Песня уже в плейлисте' };
            }

            await dbE.query(
                'INSERT INTO playlists_songs (playlist_id, song_id, date_added) VALUES (?, ?, ?)',
                [playlistId, songId, getDate()]
            );
            return { status: 'success', message: 'Песня добавлена в плейлист' };
        });
    }

    async removeTrackFromPlaylist(playlistId: number, songId: number) {
        return this.withInit(async () => {
            const pRows = await dbE.query('SELECT * FROM playlists WHERE id = ?', [playlistId]);
            if (!pRows.length) {
                return { status: 'error', message: 'Плейлист не найден' };
            }
            if (pRows[0].owner !== this.accountData.ID) {
                return { status: 'error', message: 'Нет прав на изменение этого плейлиста' };
            }
            
            const result = await dbE.query(
                'DELETE FROM playlists_songs WHERE playlist_id = ? AND song_id = ?',
                [playlistId, songId]
            );
            if (result.affectedRows === 0) {
                return { status: 'error', message: 'Песня не найдена в плейлисте' };
            }
            return { status: 'success', message: 'Песня удалена из плейлиста' };
        });
    }

    async checkPlaylistsCount() {
        return this.withInit(async () => {
            const [{ count }] = await dbE.query(
                'SELECT COUNT(*) AS count FROM `playlists` WHERE `owner` = ?',
                [this.accountData.ID]
            );

            return count < Config.LIMITS.MAX_PLAYLISTS;
        });
    }

    async isLiked(id, type) {
        return this.withInit(async () => {
            const like = await dbE.query('SELECT * FROM `music_likes` WHERE `uid` = ? AND `target_id` = ?', [this.accountData.ID, id, type]);
            return like.length > 0;
        })
    }
}

export default MusicManager;