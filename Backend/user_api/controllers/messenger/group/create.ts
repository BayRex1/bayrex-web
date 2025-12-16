import { dbM } from '../../../../lib/db.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import AccountManager from '../../../../services/account/AccountManager.js';
import GroupManager from '../../../../services/messenger/GroupManager.js';
import ImageEngine from '../../../../services/system/ImageEngine.js';
import Validator from '../../../../services/system/Validator.js';
import Config from '../../../../system/global/Config.js';
import { getDate } from '../../../../system/global/Function.js';
import { dbE } from '../../../../lib/db.js';

const createGroup = async ({ account, data }) => {
    const accountManager = new AccountManager(account.ID);
    const currentPermissions = await accountManager.getPermissions();
    
    if (!currentPermissions || !currentPermissions.NewChats) {
        const activePunishment = await dbE.query(`
            SELECT reason, punishment_type, end_date 
            FROM accounts_punishments 
            WHERE user_id = ? AND punishment_type IN ('restrict_chat', 'ban') AND is_active = 1
            ORDER BY start_date DESC 
            LIMIT 1
        `, [account.ID]);
        
        if (activePunishment && activePunishment.length > 0) {
            const punishment = activePunishment[0];
            const punishmentText = punishment.punishment_type === 'ban' ? 'заблокирован' : 'ограничено создание чатов';
            const reason = punishment.reason || 'Причина не указана';
            const endDate = punishment.end_date ? 
                new Date(punishment.end_date).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : '';
            
            const message = `У вас ${punishmentText}. Причина: ${reason}` + 
                           (endDate ? `. До: ${endDate}` : '');
            
            return { status: 'error', message };
        } else {
            return { status: 'error', message: 'У вас ограничена возможность создания новых чатов' };
        }
    }
    
    const validator = new Validator();

    validator.validateText({
        title: 'Имя группы',
        value: data.name,
        maxLength: 100
    });

    if (data.avatar) {
        const goldStatus = await AccountDataHelper.checkGoldStatus(account.ID);

        const limit = goldStatus
            ? Config.LIMITS.GOLD.MAX_AVATAR_SIZE
            : Config.LIMITS.DEFAULT.MAX_AVATAR_SIZE;
        
        await validator.validateImage(data.avatar, limit);
    }

    const group = await dbM.query('INSERT INTO `groups` (`name`, `owner`, `create_date`) VALUES (?, ?, ?)', [
        data.name,
        account.ID,
        getDate()
    ]);

    const groupManager = new GroupManager(account.ID);
    await groupManager.addMember(group.insertId);

    if (data.avatar) {
        const imageEngine = new ImageEngine();
        const image = await imageEngine.create({
            path: 'messenger/avatars',
            file: data.avatar
        })
        await dbM.query('UPDATE `groups` SET `avatar` = ? WHERE `id` =?', [
            JSON.stringify(image),
            group.insertId
        ]);
    }

    await groupManager.generateLink(group.insertId);

    return {
        status: 'success',
        group_id: group.insertId
    }
}

export default createGroup;
