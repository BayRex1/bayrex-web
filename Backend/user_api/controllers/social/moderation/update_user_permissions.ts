import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { send } from '../../../../notify_service/send.js';
import { getDate } from '../../../../system/global/Function.js';

const updateUserPermissions = async ({ account, data }) => {
    try {
        const { user_id, permissions, icons } = data.payload || {};

        if (!user_id) {
            return RouterHelper.error('ID пользователя обязателен');
        }

        if (!permissions || typeof permissions !== 'object') {
            return RouterHelper.error('Настройки разрешений обязательны');
        }

        const [userExists] = await dbE.query('SELECT ID, Username FROM accounts WHERE ID = ?', [user_id]) as any;
        if (!userExists || userExists.length === 0) {
            return RouterHelper.error('Пользователь не найден');
        }

        return await dbE.withTransaction(async (conn) => {
            const currentPermissions: any = await conn.query(
                'SELECT * FROM accounts_permissions WHERE UserID = ?',
                [user_id]
            );

            if (!currentPermissions || currentPermissions.length === 0) {
                await conn.query(
                    'INSERT INTO accounts_permissions (UserID, Admin, Posts, Comments, NewChats, MusicUpload) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        user_id,
                        permissions.Admin ? 1 : 0,
                        permissions.Posts ? 1 : 0,
                        permissions.Comments ? 1 : 0,
                        permissions.NewChats ? 1 : 0,
                        permissions.MusicUpload ? 1 : 0
                    ]
                );
            } else {
                const updateFields = [];
                const updateValues = [];

                if (typeof permissions.Posts === 'boolean') {
                    updateFields.push('Posts = ?');
                    updateValues.push(permissions.Posts ? 1 : 0);
                }
                if (typeof permissions.Comments === 'boolean') {
                    updateFields.push('Comments = ?');
                    updateValues.push(permissions.Comments ? 1 : 0);
                }
                if (typeof permissions.NewChats === 'boolean') {
                    updateFields.push('NewChats = ?');
                    updateValues.push(permissions.NewChats ? 1 : 0);
                }
                if (typeof permissions.MusicUpload === 'boolean') {
                    updateFields.push('MusicUpload = ?');
                    updateValues.push(permissions.MusicUpload ? 1 : 0);
                }
                if (typeof permissions.Admin === 'boolean') {
                    updateFields.push('Admin = ?');
                    updateValues.push(permissions.Admin ? 1 : 0);
                }

                if (updateFields.length > 0) {
                    updateValues.push(user_id);

                    await conn.query(
                        `UPDATE accounts_permissions SET ${updateFields.join(', ')} WHERE UserID = ?`,
                        updateValues
                    );
                }
            }

            if (icons && typeof icons === 'object') {
                            const [currentIcons] = await conn.query(
                'SELECT IconID FROM icons WHERE UserID = ? AND IconID IN (?, ?)',
                [user_id, 'VERIFY', 'FAKE']
            ) as any;

            const currentIconIds = currentIcons.map((icon: any) => icon.IconID);

                if (icons.VERIFY && !currentIconIds.includes('VERIFY')) {
                    await conn.query(
                        'INSERT INTO icons (UserID, IconID, Date) VALUES (?, ?, ?)',
                        [user_id, 'VERIFY', getDate()]
                    );
                } else if (!icons.VERIFY && currentIconIds.includes('VERIFY')) {
                    await conn.query(
                        'DELETE FROM icons WHERE UserID = ? AND IconID = ?',
                        [user_id, 'VERIFY']
                    );
                }

                if (icons.FAKE && !currentIconIds.includes('FAKE')) {
                    await conn.query(
                        'INSERT INTO icons (UserID, IconID, Date) VALUES (?, ?, ?)',
                        [user_id, 'FAKE', getDate()]
                    );
                } else if (!icons.FAKE && currentIconIds.includes('FAKE')) {
                    await conn.query(
                        'DELETE FROM icons WHERE UserID = ? AND IconID = ?',
                        [user_id, 'FAKE']
                    );
                }
            }

            const [updatedPermissions] = await conn.query(
                'SELECT * FROM accounts_permissions WHERE UserID = ?',
                [user_id]
            ) as any;

            const [updatedIcons] = await conn.query(
                'SELECT IconID FROM icons WHERE UserID = ? AND IconID IN (?, ?)',
                [user_id, 'VERIFY', 'FAKE']
            ) as any;

            if (updatedPermissions && updatedPermissions.length > 0) {
                const perms = updatedPermissions[0] as any;
                const iconIds = updatedIcons.map((icon: any) => icon.IconID);
                
                await send(user_id, {
                    from: account.ID,
                    action: 'permissions_updated',
                    content: {
                        type: 'permissions_updated',
                        payload: {
                            Posts: !!perms.Posts,
                            Comments: !!perms.Comments,
                            NewChats: !!perms.NewChats,
                            MusicUpload: !!perms.MusicUpload,
                            Admin: !!perms.Admin,
                            Verified: iconIds.includes('VERIFY'),
                            Fake: iconIds.includes('FAKE')
                        }
                    }
                });

                return RouterHelper.success({
                    message: 'Разрешения пользователя обновлены',
                    permissions: {
                        Posts: !!perms.Posts,
                        Comments: !!perms.Comments,
                        NewChats: !!perms.NewChats,
                        MusicUpload: !!perms.MusicUpload,
                        Admin: !!perms.Admin,
                        Verified: iconIds.includes('VERIFY'),
                        Fake: iconIds.includes('FAKE')
                    }
                });
            }

            return RouterHelper.error('Не удалось обновить разрешения');
        });

    } catch (error) {
        console.error('Ошибка обновления разрешений:', error);
        return RouterHelper.error('Внутренняя ошибка сервера');
    }
};

export default updateUserPermissions; 