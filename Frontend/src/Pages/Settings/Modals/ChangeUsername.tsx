import { use, useState } from 'react';
import { useModalsStore } from '../../../Store/modalsStore';
import { useTranslation } from 'react-i18next';
import { Button, FormButton, TextInput } from '../../../UIKit';
import { useAuth } from '../../../System/Hooks/useAuth';
import { useWebSocket } from '../../../System/Context/WebSocket';

const ChangeUsername = () => {
    const { accountData, updateAccount } = useAuth();
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    const { openModal } = useModalsStore() as any;
    const [username, setUsername] = useState(accountData.username);

    const change = () => {
        wsClient.send({
            type: 'social',
            action: 'change_profile/username',
            username: username
        }).then((res) => {
            if (res.status === 'success') {
                updateAccount({ username: username });
                openModal({
                    type: 'alert',
                    props: {
                        title: t('success'),
                        message: 'Ваше уникальное имя изменено'
                    }
                })
            } else if (res.status === 'error') {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('error'),
                        message: res.message
                    }
                });
            }
        })
    }

    return (
        <>
            <img
                src="/static_sys/Images/All/ChangeUsername.svg"
                className="UI-PB_Image"
                alt="фыр"
                draggable={false}
            />
            <div className="UI-PB_InputText">
                Сменить имя можно сколько угодно раз, но если его займёт кто-то другой вернуть уже не получиться.
            </div>
            <div
                className="UI-Block"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                }}
            >
                <TextInput
                    value={username}
                    onChange={(e) => { setUsername(e.target.value) }}
                    placeholder="@введите_текст"
                    type="text"
                    transparent={true}
                />
                <div style={{ marginTop: 5, display: 'flex' }}>
                    <Button
                        title={t('change')}
                        onClick={change}
                        buttonStyle="action"
                        isActive={(username !== accountData.username)}
                        style={{ flex: 1 }}
                    />
                </div>
            </div>

        </>
    );
};

export default ChangeUsername;
