import { useState } from 'react';
import { HandleLinkIcon } from '../../../System/Elements/Handlers';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';
import { Avatar, Button, TextInput } from '../../../UIKit';
import { useAuth } from '../../../System/Hooks/useAuth';

const EditLink = ({ params, setPartitionOpen }) => {
    const { accountData, updateOrCreateLink } = useAuth();
    const { openModal } = useModalsStore() as any;
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState(params?.link?.title);
    const [link, setLink] = useState(params?.link?.url);

    const handleError = (data) => {
        setIsLoading(false);
        openModal({
            type: 'alert',
            props: {
                title: t('error'),
                message: data.message
            }
        });
    }

    const change = () => {
        wsClient.send({
            type: 'social',
            action: 'edit_link',
            link_id: params?.link?.id,
            title: title,
            link: link
        }).then((res) => {
            if (res.status === 'success') {
                setTitle('');
                setLink('');
                openModal({
                    type: 'alert',
                    props: {
                        title: t('success'),
                        message: 'Ссылка изменена'
                    }
                });
                updateOrCreateLink({ id: params.link.id, title: title, url: link });
                setPartitionOpen(false);
            } else if (res.status === 'error') {
                handleError(res);
            }
        })
    }

    const deleteLink = () => {
        wsClient.send({
            type: 'social',
            action: 'delete_link',
            link_id: params.link.id
        }).then((res) => {
            if (res.status === 'success') {
                setTitle('');
                setLink('');
                openModal({
                    type: 'info',
                    title: t('success'),
                    text: 'Ссылка удалена'
                });
                setPartitionOpen(false);
            } else if (res.status === 'error') {
                handleError(res);
            }
        })
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

                <div style={{
                    marginTop: 5,
                    display: 'flex'
                }}>
                    <Button
                        title={t('delete')}
                        onClick={deleteLink}
                        style={{ flex: 1 }}
                    />
                    <Button
                        title={t('change')}
                        onClick={change}
                        isLoading={isLoading}
                        buttonStyle="action"
                        style={{ flex: 1 }}
                    />
                </div>
            </div>
        </>
    );
}

export default EditLink;