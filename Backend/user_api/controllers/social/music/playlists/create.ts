import MusicManager from '../../../../../services/music/MusicManager.js';

const create = async ({ account, data }) => {
    const { name, description, privacy } = data.payload;

    const musicManager = new MusicManager(account.ID);

    return await musicManager.createPlaylist(name, description, privacy);
}

export default create;
