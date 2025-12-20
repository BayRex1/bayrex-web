import { dbE } from '../../../../lib/db.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import ChannelManager from '../../../../services/account/ChannelManager.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import Validator from '../../../../services/system/Validator.js';
import Config from '../../../../system/global/Config.js';
import { getDate } from '../../../../system/global/Function.js';

const create = async ({ account, data }) => {
    const {
        avatar,
        cover,
        name,
        username,
        description
    } = data.payload || {};

    const validator = new Validator();

    try {
        await validator.validateUsername(username);
        validator.validateText({
            title: 'Имя',
            value: name,
            maxLength: 60
        });
        if (description) {
            validator.validateText({
                title: 'Описание',
                value: description,
                maxLength: 1000
            });
        }
        const goldStatus = await AccountDataHelper.checkGoldStatus(account.ID);

        if (avatar) {
            const limit = goldStatus
                ? Config.LIMITS.GOLD.MAX_AVATAR_SIZE
                : Config.LIMITS.DEFAULT.MAX_AVATAR_SIZE;
            await validator.validateImage(avatar, limit);
        }
        if (cover) {
            const limit = goldStatus
                ? Config.LIMITS.GOLD.MAX_COVER_SIZE
                : Config.LIMITS.DEFAULT.MAX_COVER_SIZE;
            await validator.validateImage(cover, limit);
        }
    } catch (error) {
        return RouterHelper.error(error.message);
    }

    const channels = await dbE.query('SELECT * FROM `channels` WHERE `Owner` = ?', [account.ID]);

    if (channels.length > 19) {
        return RouterHelper.error('Нельзя создать более 20-ти каналов');
    }

    const answer = await dbE.query('INSERT INTO `channels` (`Name`, `Username`, `Owner`, `Description`, `CreateDate`) VALUES (?, ?, ?, ?, ?)', [
        name,
        username,
        account.ID,
        description,
        getDate()
    ]);

    if (avatar || cover) {
        const channelManager = new ChannelManager(answer.insertId);
        if (avatar) {
            channelManager.changeAvatar(avatar);
        }
        if (cover) {
            channelManager.changeCover(cover);
        }
    }

    return RouterHelper.success();
}

export default create;
