import ChannelManager from '../../../../../../services/account/ChannelManager.js';
import RouterHelper from '../../../../../../services/system/RouterHelper.js';

const delete_avatar = async ({ account, data }) => {
    if (await ChannelManager.checkOwner(account.ID, data.channel_id)) {
        const channelManager = new ChannelManager(data.channel_id);
        const answer = await channelManager.deleteAvatar();
    
        return answer;
    } else {
        return RouterHelper.error('Вы не владелец канала.');
    }
}

export default delete_avatar;
