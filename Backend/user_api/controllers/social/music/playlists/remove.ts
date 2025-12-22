import MusicManager from '../../../../../services/music/MusicManager';

const remove = async ({ account, data }) => {
    const { playlist_id, song_id } = data.payload;
    
    const musicManager = new MusicManager(account.ID)
    return await musicManager.removeTrackFromPlaylist(playlist_id, song_id);
}

export default remove;
