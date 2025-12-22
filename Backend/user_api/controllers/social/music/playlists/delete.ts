import MusicManager from '../../../../../services/music/MusicManager';

const deletePlaylist = async ({ account, data }) => {
    const { playlist_id } = data.payload;

    const musicManager = new MusicManager(account.ID)

    return await musicManager.deletePlaylist(playlist_id);
}

export default deletePlaylist;
