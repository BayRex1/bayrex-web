import { useState } from 'react';
import { HandleLinkIcon } from '../../../System/Elements/Handlers';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';
import { Avatar, Button, TextInput } from '../../../UIKit';
import { useAuth } from '../../../System/Hooks/useAuth';

const AddLink = ({ setPartitionOpen }) => {
    const { accountData, updateOrCreateLink } = useAuth();
    const { openModal } = useModalsStore();
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');

    const add = () => {
        wsClient.send({
            type: 'social',
            action: 'add_link',
            title: title,
            link: link
        }).then((res) => {
            if (res.action === 'add_link') {
                if (res.status === 'success') {
                    setTitle('');
                    setLink('');
                    setIsLoading(false);
                    updateOrCreateLink({
                        id: res.link_id,
                        title: title,
                        url: link
                    });
                    setPartitionOpen(false);
                } else if (res.status === 'error') {
                    setIsLoading(false);
                    (openModal as any)({
                        type: 'alert',
                        props: {
                            title: t('error'),
                            message: res.message
                        }
                    });
                }
            }
        })
        setIsLoading(true);
    }

    return (
        <>
            <div className="Settings-LinkContainer">
                <Avatar
                    avatar={accountData.avatar}
                    name={accountData.name}
                    size={88}
                />
                <div className="LinkIcon">
                    <HandleLinkIcon link={link} />
                </div>
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
                    placeholder="Имя ссылки"
                    maxLength={50}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    transparent={true}
                />
                <TextInput
                    placeholder="Ссылка"
                    maxLength={150}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    transparent={true}
                />
                <div style={{ marginTop: 5, display: 'flex' }}>
                    <Button
                        title={t('add')}
                        onClick={add}
                        isLoading={isLoading}
                        buttonStyle="action"
                        isActive={(title.length > 0 && link.length > 0)}
                        style={{ flex: 1 }}
                    />
                </div>
            </div>
        </>
    );
}

export default AddLink;
