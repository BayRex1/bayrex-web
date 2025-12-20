import { useDispatch, useSelector } from 'react-redux';
import BaseConfig from '../../../Configs/Base';
import { useModalsStore } from '../../../Store/modalsStore';
import { useEffect, useState } from 'react';
import { I_BACK, I_DELETE, I_DOTS, I_DOWNLOAD, I_PLUS, I_SHARE, I_REPORT } from '../../../System/UI/IconPack';
import { removePlaylist, setPlay } from '../../../Store/Slices/musicPlayer';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useNavigate } from 'react-router-dom';
import { GovernButtons, MusicCover } from '../../../UIKit';
import ReportModal from '../../../Components/Modals/ReportModal';

export interface Song {
    id: number | string;
    title: string;
    artist: string;
    cover?: any;
    file: string;
    liked?: boolean;
    [key: string]: any;
}

interface HandleSongProps {
    item: Song;
    category: any;
    selectSong: any;
}

export interface Category {
    title: string;
    get: string;
    songs: Song[];
    loaded: boolean;
    startIndex: number;
}

const HandleSong: React.FC<HandleSongProps> = ({ item, category, selectSong }) => {
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore() as any;
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const playerState = useSelector((state: any) => state.musicPlayer);
    const [contextIsOpen, setContextIsOpen] = useState<boolean>(false);
    const [playlistsIsShow, setPlaylistsIsShow] = useState<boolean>(false);

    useEffect(() => {
        if (!contextIsOpen) {
            setPlaylistsIsShow(false);
        }
    }, [contextIsOpen])

    const download = () => {
        // Сделать загрузку песни
    };

    const share = () => {
        navigator.clipboard.writeText(`${BaseConfig.domains.share}/music/${item.id}`);
        openModal({
            type: 'alert',
            props: {
                title: 'Успешно',
                message: 'Ссылка на песню скопирована в буфер обмена'
            }
        });
    };

    const deletePlaylist = () => {
        openModal({
            type: 'query',
            props: {
                title: t('are_you_sure'),
                message: 'После удаления плейлист нельзя восстановить',
                onConfirm: () => {
                    wsClient.send({
                        type: 'social',
                        action: 'music/playlists/delete',
                        payload: {
                            playlist_id: item.id
                        }
                    }).then((res: any) => {
                        if (res.status === 'success') {
                            dispatch(removePlaylist(item.id));
                        }
                    })
                }
            }
        });
    }

    const contextButtons = [
        ...(item.type === 0 ? [
            {
                icon: <I_PLUS />,
                title: t('add_to_playlist'),
                onClick: () => {
                    setPlaylistsIsShow(true)
                }
            },
            {
                icon: <I_DOWNLOAD />,
                title: t('download'),
                onClick: download
            },
            {
                icon: <I_SHARE />,
                title: t('share'),
                onClick: share
            },
            {
                icon: <I_REPORT />,
                title: t('report'),
                onClick: () => {
                    openModal({
                        type: 'routed',
                        props: {
                            title: t('report_title'),
                            children: (
                                <ReportModal
                                    targetType="music"
                                    targetId={item.id}
                                />
                            )
                        }
                    });
                }
            }
        ] : [
            {
                icon: <I_DELETE />,
                title: t('delete'),
                onClick: deletePlaylist
            }
        ])
    ];

    const add = (id) => {
        wsClient.send({
            type: 'social',
            action: 'music/playlists/add',
            payload: {
                playlist_id: id,
                song_id: item.id
            }
        })
    }

    const playlists = [
        ...[
            {
                icon: <I_BACK />,
                title: t('back'),
                onClick: () => {
                    setPlaylistsIsShow(false);
                }
            }
        ],
        ...playerState.my_library.map((playlist) => ({
            icon: <I_PLUS />,
            title: playlist.title,
            onClick: () => add(playlist.id)
        }))
    ];

    const open = () => {
        if (item.type === 0) {
            selectSong(item, category.items, null);
            dispatch(setPlay(true));
        } else {
            navigate(`/music/playlist/${item.id}`);
        }
    }

    return (
        <div className="Music-SongPrev">
            <MusicCover
                cover={item.cover}
                width={150}
                borderRadius={10}
                shadows={true}
                icon={item.type === 1 ? item.icon : null}
                onClick={open}
            />
            <div className="MetaAndButton">
                <div className="Metadata">
                    <div className="Name">{item.title}</div>
                    <div className="Author">
                        {
                            item.type === 0 ? item.artist : item.author.name
                        }
                    </div>
                </div>
                {
                    item.id !== 'fav' && (
                        <>
                            <GovernButtons
                                isOpen={contextIsOpen}
                                setIsOpen={setContextIsOpen}
                                buttons={contextButtons}
                            />
                            <GovernButtons
                                isOpen={playlistsIsShow}
                                setIsOpen={setPlaylistsIsShow}
                                buttons={playlists}
                            />
                            <button
                                onClick={() => {
                                    setContextIsOpen(!contextIsOpen);
                                }}
                                className="UI-GovernButton"
                            >
                                <I_DOTS />
                            </button>
                        </>
                    )
                }
            </div>
        </div>
    );
};

export default HandleSong;
