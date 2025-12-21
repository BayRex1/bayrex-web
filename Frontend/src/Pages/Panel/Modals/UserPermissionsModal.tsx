import { useState, useEffect } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';
import { useTranslation } from 'react-i18next';
import { TextInput, Button, Block, Switch, PartitionName } from '../../../UIKit';

interface Permissions {
    Posts: boolean;
    Comments: boolean;
    NewChats: boolean;
    MusicUpload: boolean;
    Admin: boolean;
}

interface UserIcons {
    VERIFY: boolean;
    FAKE: boolean;
}

interface UserPermissionsModalProps {
    user: {
        id: number;
        name: string;
        username: string;
    };
}

const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({ user }) => {
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore() as any;
    const { t } = useTranslation();

    const [permissions, setPermissions] = useState<Permissions | null>(null);
    const [icons, setIcons] = useState<UserIcons>({ VERIFY: false, FAKE: false });
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUserData();
    }, [user.id]);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const response = await wsClient.send({
                type: 'social',
                action: 'moderation/get_user_permissions',
                payload: {
                    user_id: user.id
                }
            });

            if (response.status === 'success') {
                setPermissions(response.permissions);
                if (response.icons) {
                    setIcons(response.icons);
                }
            } else {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('error'),
                        message: response.message || 'Ошибка загрузки разрешений'
                    }
                });
            }
        } catch (err) {
            openModal({
                type: 'alert',
                props: {
                    title: t('error'),
                    message: 'Ошибка подключения'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const updatePermissions = async () => {
        if (!permissions) return;

        setLoading(true);
        try {
            const response = await wsClient.send({
                type: 'social',
                action: 'moderation/update_user_permissions',
                payload: {
                    user_id: user.id,
                    permissions,
                    icons,
                    reason: reason.trim()
                }
            });

            if (response.status === 'success') {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('success'),
                        message: 'Разрешения успешно обновлены'
                    }
                });
            } else {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('error'),
                        message: response.message || 'Ошибка обновления разрешений'
                    }
                });
            }
        } catch (err) {
            openModal({
                type: 'alert',
                props: {
                    title: t('error'),
                    message: 'Ошибка подключения'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (key: keyof Permissions) => {
        if (!permissions) return;
        setPermissions(prev => prev ? { ...prev, [key]: !prev[key] } : null);
    };

    const toggleIcon = (key: keyof UserIcons) => {
        setIcons(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            return newState;
        });
    };

    if (loading && !permissions) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">Загрузка...</div>
            </div>
        );
    }

    if (!permissions) return null;

    return (
        <>
            <div className="UserPermissions-List">
                <Block className="UserPermissions-Item">
                    <span>Создание постов</span>
                    <Switch
                        checked={permissions.Posts}
                        onChange={() => togglePermission('Posts')}
                    />
                </Block>

                <Block className="UserPermissions-Item">
                    <span>Написание комментариев</span>
                    <Switch
                        checked={permissions.Comments}
                        onChange={() => togglePermission('Comments')}
                    />
                </Block>

                <Block className="UserPermissions-Item">
                    <span>Создание чатов</span>
                    <Switch
                        checked={permissions.NewChats}
                        onChange={() => togglePermission('NewChats')}
                    />
                </Block>

                <Block className="UserPermissions-Item">
                    <span>Загрузка музыки</span>
                    <Switch
                        checked={permissions.MusicUpload}
                        onChange={() => togglePermission('MusicUpload')}
                    />
                </Block>

                <Block className="UserPermissions-Item UserPermissions-Admin">
                    <span>Администратор</span>
                    <Switch
                        checked={permissions.Admin}
                        onChange={() => togglePermission('Admin')}
                    />
                </Block>

                <div className="UserPermissions-Section">
                    <PartitionName
                        name="Иконки профиля"
                    />
                    <Block className="UserPermissions-Item">
                        <span>Верификация</span>
                        <Switch
                            checked={icons.VERIFY}
                            onChange={() => toggleIcon('VERIFY')}
                        />
                    </Block>

                    <Block className="UserPermissions-Item">
                        <span>Фейк</span>
                        <Switch
                            checked={icons.FAKE}
                            onChange={() => toggleIcon('FAKE')}
                        />
                    </Block>
                </div>
            </div>

            <Block style={{ marginTop: 20 }}>
                <TextInput
                    placeholder="Причина изменения (необязательно)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{ width: '100%' }}
                />
            </Block>
            <Button
                title={loading ? 'Сохранение...' : 'Сохранить'}
                onClick={updatePermissions}
                isActive={!loading}
                buttonStyle="action"
                style={{ margin: '10px auto' }}
            />
        </>
    );
};

export default UserPermissionsModal; 
