import { useTranslation } from 'react-i18next';
import { useModalsStore } from '../../../Store/modalsStore';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { ChangeEvent, useState } from 'react';
import { FormButton, Textarea, TextInput } from '../../../UIKit';
import { useDispatch, useSelector } from 'react-redux';
import { setLibrary } from '../../../Store/Slices/musicPlayer';
import { useAuth } from '../../../System/Hooks/useAuth';

const CreatePlaylist = ({ close }) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore() as any;
    const { accountData } = useAuth();
    const playerState = useSelector((state: any) => state.musicPlayer);
    const dispatch = useDispatch();
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    const create = () => {
        wsClient.send({
            type: 'social',
            action: 'music/playlists/create',
            payload: {
                name: name,
                description: description,
                privacy: 0
            }
        }).then((res) => {
            if (res.status === 'success') {
                dispatch(setLibrary([
                    {
                        id: res.playlist_id,
                        type: 1,
                        title: name,
                        author: {
                            name: accountData.name
                        },
                        add_date: new Date().toISOString()
                    },
                    ...playerState.my_library
                ]));
                close();
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
            <div className="Inputs">
                <TextInput
                    placeholder="Введите название"
                    value={name}
                    maxLength={60}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
                <Textarea
                    placeholder="Введите описание"
                    value={description}
                    maxLength={1000}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                />
            </div>
            <FormButton
                title={t('create')}
                onClick={create}
            />
        </>
    );
};

export default CreatePlaylist;
