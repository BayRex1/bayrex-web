import ChannelManager from '../../../../../../services/account/ChannelManager.js';
import RouterHelper from '../../../../../../services/system/RouterHelper.js';

const upload_cover = async ({ account, data }) => {
    const { channel_id, file } = data.payload || {};
    
    if (await ChannelManager.checkOwner(account.ID, channel_id)) {
        const channelManager = new ChannelManager(channel_id);
        const answer = await channelManager.changeCover(file);
    
        return answer;
    } else {
        return RouterHelper.error('Вы не владелец канала.');
    }
}

export default upload_cover;
