import ChannelManager from '../../../../../services/account/ChannelManager.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';

const description = async ({ account, data }) => {
    const { channel_id, description } = data.payload || {};

    if (await ChannelManager.checkOwner(account.ID, channel_id)) {
        const channelManager = new ChannelManager(channel_id);
        const answer = await channelManager.changeDescription(description);
    
        return answer;
    } else {
        return RouterHelper.error('Вы не владелец канала.');
    }
}

export default description;
