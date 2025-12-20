import MusicManager from '../../../../services/music/MusicManager.js';

const like = async ({ account, data }) => {
    if (!data?.song_id) {
        return { status: 'error', message: 'Песня не найдена' };
    }

    const musicManager = new MusicManager(account.ID);
    return await musicManager.like(data.song_id, data.target);
}

export default like;
