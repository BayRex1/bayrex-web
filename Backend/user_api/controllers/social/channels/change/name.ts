import ChannelManager from '../../../../../services/account/ChannelManager.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';

const name = async ({ account, data }) => {
    const { channel_id, name } = data.payload || {};

    if (await ChannelManager.checkOwner(account.ID, channel_id)) {
        const channelManager = new ChannelManager(channel_id);
        const answer = await channelManager.changeName(name);
    
        return answer;
    } else {
        return RouterHelper.error('Вы не владелец канала.');
    }
}

export default name;
