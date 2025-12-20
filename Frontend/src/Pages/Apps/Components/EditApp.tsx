import { useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyInput, FormButton, Textarea, TextInput } from '../../../UIKit';
import { I_UPLOAD_IMAGE } from '../../../System/UI/IconPack';
import BaseConfig from '../../../Configs/Base';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';

const EditApp = ({ app }: any) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore() as any;
    const [icon, setIcon] = useState<string | null>(app.icon || null);
    const [name, setName] = useState<string>(app.name || '');
    const [url, setUrl] = useState<string>(app.url || '');
    const [description, setDescription] = useState<string>(app.description || '');

    const imageToB64 = (image: File | null): Promise<string | null> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string | null);
            };
            reader.onerror = reject;

            if (image) {
                reader.readAsDataURL(image);
            }
        });
    };

    const handleIcon = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            const b64 = await imageToB64(file);
            setIcon(b64);
        }
    };

    const change = () => {
        wsClient.send({
            type: 'apps',
            action: 'edit_app',
            edit: {
                app_id: app.id,
                icon: icon !== app.icon ? icon : null,
                name: name !== app.name ? name : null,
                description: description !== app.description ? description : null,
                url: url !== app.url ? url : null
            }
        }).then((res) => {
            if (res.status === 'success') {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('success'),
                        message: res.message
                    }
                })
            } else {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('error'),
                        message: res.message
                    }
                })
            }
        })
    }

    return (
        <>
            <div
                className="UI-AppIcon"
                style={{ borderRadius: 14 }}
            >
                <input
                    id="CC-AvatarInput"
                    type="file"
                    accept="image/*"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files && e.target.files.length > 0) {
                            handleIcon(e);
                        }
                    }}
                />
                <label htmlFor="CC-AvatarInput"></label>
                {icon ? <img src={icon} alt="App Icon" /> : <I_UPLOAD_IMAGE />}
            </div>
            <div className="Inputs">
                <TextInput
                    placeholder="Введите название"
                    value={name}
                    maxLength={50}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
                <Textarea
                    placeholder="Введите описание"
                    value={description}
                    maxLength={150}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                />
                <div className="Info">
                    {t('app_info_1')}
                </div>
                <TextInput
                    placeholder={t('input_text')}
                    value={url}
                    maxLength={350}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                />
                <div className="Info">
                    {t('app_info_2')}
                </div>
                <CopyInput
                    value={app.api_key}
                />
                <div className="Info">
                    {t('app_info_3')}
                </div>
                <CopyInput
                    value={`${BaseConfig.domains.client}/connect_app/${app.id}`}
                />
            </div>
            <FormButton
                title={t('change')}
                onClick={change}
            />
        </>
    );
};

export default EditApp;
