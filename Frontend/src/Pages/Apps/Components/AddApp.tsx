import { useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FormButton, Textarea, TextInput } from '../../../UIKit';
import { I_UPLOAD_IMAGE } from '../../../System/UI/IconPack';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';

const AddApp: React.FC = () => {
    const { openModal } = useModalsStore() as any;
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    const [icon, setIcon] = useState<string | null>(null);
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');

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

    const create = () => {
        wsClient.send({
            type: 'apps',
            action: 'add_app',
            icon: icon || null,
            name: name,
            description: description
        }).then((res) => {
            if (res.status ==='success') {
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
    };

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
                    type="text"
                    maxLength={50}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
                <Textarea
                    placeholder="Введите описание"
                    value={description}
                    maxLength={150}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                />
            </div>
            <FormButton
                title={t('add')}
                onClick={create}
            />
        </>
    );
};

export default AddApp;
