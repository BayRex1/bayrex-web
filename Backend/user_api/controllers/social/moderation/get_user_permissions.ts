import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const getUserPermissions = async ({ data }) => {
    try {
        const { user_id } = data.payload || {};

        if (!user_id) {
            return RouterHelper.error('ID пользователя обязателен');
        }

        const userExists = await dbE.query('SELECT ID FROM accounts WHERE ID = ?', [user_id]);
        if (!userExists || userExists.length === 0) {
            return RouterHelper.error('Пользователь не найден');
        }

        const permissions = await dbE.query(
            'SELECT * FROM accounts_permissions WHERE UserID = ?',
            [user_id]
        );

        const icons = await dbE.query(
            'SELECT IconID FROM icons WHERE UserID = ? AND IconID IN (?, ?)',
            [user_id, 'VERIFY', 'FAKE']
        );

        const iconIds = icons.map((icon: any) => icon.IconID);

        if (!permissions || permissions.length === 0) {
            await dbE.query(
                'INSERT INTO accounts_permissions (UserID, Admin, Posts, Comments, NewChats, MusicUpload) VALUES (?, 0, 1, 1, 1, 1)',
                [user_id]
            );
            
            const newPermissions = await dbE.query(
                'SELECT * FROM accounts_permissions WHERE UserID = ?',
                [user_id]
            );
            
            return RouterHelper.success({
                permissions: {
                    Posts: !!newPermissions[0].Posts,
                    Comments: !!newPermissions[0].Comments,
                    NewChats: !!newPermissions[0].NewChats,
                    MusicUpload: !!newPermissions[0].MusicUpload,
                    Admin: !!newPermissions[0].Admin
                },
                icons: {
                    VERIFY: iconIds.includes('VERIFY'),
                    FAKE: iconIds.includes('FAKE')
                }
            });
        }

        const permission = permissions[0] as any;
        
        return RouterHelper.success({
            permissions: {
                Posts: !!permission.Posts,
                Comments: !!permission.Comments,
                NewChats: !!permission.NewChats,
                MusicUpload: !!permission.MusicUpload,
                Admin: !!permission.Admin
            },
            icons: {
                VERIFY: iconIds.includes('VERIFY'),
                FAKE: iconIds.includes('FAKE')
            }
        });

    } catch (error) {
        console.error('Ошибка получения разрешений:', error);
        return RouterHelper.error('Внутренняя ошибка сервера');
    }
};

export default getUserPermissions; 