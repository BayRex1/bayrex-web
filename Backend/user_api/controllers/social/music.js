import MusicManager from '../../../services/music/MusicManager.js';

export const loadSongs = async ({ account, data }) => {
    if (!account) return;
    
    const musicManager = new MusicManager(account.ID);
    return await musicManager.loadSongs(data);
}

export const loadSong = async ({ account, data }) => {
    if (!account) return;
    
    const musicManager = new MusicManager(account.ID);
    return await musicManager.loadSong(data.song_id);
}