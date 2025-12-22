import { dbE } from '../../../../../lib/db';
import MusicManager from '../../../../../services/music/MusicManager';
import RouterHelper from '../../../../../services/system/RouterHelper';

const load = async ({ account, data }) => {
    const { playlist_id } = data.payload;

    const playlist = await dbE.query('SELECT * FROM playlists WHERE id = ?', [playlist_id]);
    const songs = [];

    if (playlist.length < 1) {
        return RouterHelper.error('Плейлист не найден')
    } else {
        const musicManager = new MusicManager(account.ID);

        const isLiked = musicManager.isLiked(playlist_id, 1);

        if (!isLiked) {
            return RouterHelper.error('Плейлист не найден')
        }

        const songsRows = await dbE.query('SELECT * FROM playlists_songs WHERE playlist_id = ? ORDER BY `date_added` DESC', [playlist[0].id]);

        for (const { song_id } of songsRows) {
            const [songRow] = await dbE.query('SELECT * FROM songs WHERE id = ?', [song_id]);
            if (songRow) {
                songs.push(await musicManager.handleSong(songRow));
            }
        }
    }

    return RouterHelper.success({
        playlist_data: {
            id: playlist[0].id,
            title: playlist[0].name,
            description: playlist[0].description,
            create_date: playlist[0].create_date
        },
        songs: songs
    })
}

export default load;
