import MusicManager from '../../../../../services/music/MusicManager.js';

const add = async ({ account, data }) => {
    const { playlist_id, song_id } = data.payload;
    
    const musicManager = new MusicManager(account.ID)
    return await musicManager.addTrackToPlaylist(playlist_id, song_id);
}

export default add;
