import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useTranslation } from 'react-i18next';
import { GovernButtons, MusicCover, NavigatedHeader } from '../../../UIKit';
import { I_BACK, I_CLOSE, I_DISLIKE, I_DOTS, I_DOWNLOAD, I_LIKE, I_PLUS, I_SHARE } from '../../../System/UI/IconPack';
import { HandleTimeAge } from '../../../System/Elements/Handlers';
import BaseConfig from '../../../Configs/Base';
import { useAuth } from '../../../System/Hooks/useAuth';
import { useSelector } from 'react-redux';
import { useModalsStore } from '../../../Store/modalsStore';

const Song = ({ song, playlist, trackNumber, selectSong, songs }) => {
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    const { openModal } = useModalsStore() as any;
    const [contextIsOpen, setContextIsOpen] = useState<boolean>(false);
    const [liked, setLiked] = useState<boolean>(song.liked);
    const [playlistsIsShow, setPlaylistsIsShow] = useState<boolean>(false);
    const playerState = useSelector((state: any) => state.musicPlayer);

    useEffect(() => {
        if (!contextIsOpen) {
            setPlaylistsIsShow(false);
        }
    }, [contextIsOpen])

    const download = () => {
        // Сделать загрузку песни
    };

    const share = () => {
        navigator.clipboard.writeText(`${BaseConfig.domains.share}/music/${song.id}`);
        openModal({
            type: 'alert',
            props: {
                title: 'Успешно',
                message: 'Ссылка на песню скопирована в буфер обмена'
            }
        });
    };

    const add = (id) => {
        wsClient.send({
            type: 'social',
            action: 'music/playlists/add',
            payload: {
                playlist_id: id,
                song_id: song.id
            }
        })
    }

    const remove = () => {
        if (playlist === 'fav') {
            wsClient.send({
                type: 'social',
                action: 'music/like',
                song_id: song.id
            });
        } else {
            wsClient.send({
                type: 'social',
                action: 'music/playlists/remove',
                payload: {
                    playlist_id: playlist,
                    song_id: song.id
                }
            })
        }
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

    const contextButtons = [
        {
            icon: <I_CLOSE />,
            title: t('remove_from_playlist'),
            onClick: remove
        },
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
        }
    ];

    const formatTime = (timeString) => {
        const totalSeconds = Math.floor(timeString);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = n => n.toString().padStart(2, '0');

        if (hours > 0) {
            return `${hours}:${pad(minutes)}:${pad(seconds)}`;
        } else {
            return `${minutes}:${pad(seconds)}`;
        }
    };

    const open = () => {
        selectSong(song, songs, playlist);
    }

    const handleLike = () => {
        setLiked(!liked);
        wsClient.send({
            type: 'social',
            action: 'music/like',
            song_id: song.id
        });
    }

    return (
        <div className="Song">
            <div className="Number">
                {trackNumber}
            </div>
            <MusicCover
                cover={song.cover}
                width={45}
                shadows={false}
                onClick={open}
            />
            <div className="Info">
                <div className="Base">
                    <div onClick={open} className="Title">
                        {song.title}
                    </div>
                    <div className="Author">
                        {song.artist}
                    </div>
                </div>
                <div className="DateAndDuration">
                    <HandleTimeAge inputDate={song.date_added} /> • {formatTime(song.duration)}
                </div>
            </div>
            <button
                onClick={handleLike}
                className="Like"
            >
                {
                    liked ? (
                        <I_DISLIKE />
                    ) : (
                        <I_LIKE />
                    )
                }
            </button>
            <GovernButtons
                isOpen={contextIsOpen}
                buttons={contextButtons}
            />
            <GovernButtons
                isOpen={playlistsIsShow}
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
        </div>
    )
}

const Playlist = ({ selectSong }: any) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const { accountData } = useAuth();
    const params = useParams<any>();
    const navigate = useNavigate();
    const [playlistData, setPlaylistData] = useState<any>({
        title: t('load'),
        description: t('load')
    });
    const [songsLoaded, setSongsLoaded] = useState(false);
    const [songs, setSongs] = useState([]);

    useEffect(() => {
        if (params.song_id) {
            wsClient.send({
                type: 'social',
                action: 'load_song',
                song_id: params.song_id
            }).then((res: any) => {
                if (res.status === 'success') {
                    selectSong(res.song, null, params.playlist_id);
                }
            })
        }
    }, [])

    useEffect(() => {
        if (params.playlist_id === 'fav') {
            wsClient.send({
                type: 'social',
                action: 'load_songs',
                songs_type: 'favorites',
                start_index: 0
            }).then((res: any) => {
                setPlaylistData({
                    title: t('music_favorites'),
                    description: t('music_favorites_desc'),
                    create_date: accountData.create_date
                })
                if (res.status === 'success') {
                    setSongs(res.songs);
                    setSongsLoaded(true);
                }
            })
        } else {
            wsClient.send({
                type: 'social',
                action: 'music/playlists/load',
                payload: {
                    playlist_id: params.playlist_id
                }
            }).then((res: any) => {
                if (res.status === 'success') {
                    setPlaylistData({
                        title: res.playlist_data.title,
                        description: res.playlist_data.description,
                        create_date: accountData.create_date
                    })
                    setSongs(res.songs);
                    setSongsLoaded(true);
                }
            })
        }
    }, [params.playlist_id]);

    const plural = (n: number, one: string, few: string, many: string) => {
        const mod100 = n % 100;
        const mod10 = n % 10;
        if (mod100 > 10 && mod100 < 20) return many;
        if (mod10 > 1 && mod10 < 5) return few;
        if (mod10 === 1) return one;
        return many;
    };

    const formatDuration = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        const parts: string[] = [];

        if (h > 0) {
            parts.push(`${h} ${plural(h, t('hours'), t('hours_plural_1'), t('hours_plural_2'))}`);
        }
        if (m > 0) {
            parts.push(`${m} ${plural(m, t('minutes'), t('minutes_plural_1'), t('minutes_plural_2'))}`);
        }
        if (h === 0 && m === 0) {
            parts.push(`${s} ${plural(s, t('seconds'), t('seconds_plural_1'), t('seconds_plural_2'))}`);
        }

        return parts.join(' ');
    };

    const totalDuration = songs
        .reduce((sum, song: any) => sum + (Number(song.duration) || 0), 0);

    return (
        <div className="Music-Playlist UI-B_FIRST">
            <NavigatedHeader
                title={t('playlist')}
                isOverlay={false}
                onBack={() => navigate('/music')}
                paddingLeft={0}
            />
            <div className="Music-Playlist-Content">
                <div className="Header">
                    <MusicCover
                        icon={<I_LIKE />}
                        width={200}
                        borderRadius={12}
                        shadows={true}
                    />
                    <div className="Info">
                        <div className="Title">
                            {playlistData.title}
                        </div>
                        <div className="Info">
                            {songs.length} {t('songs')} • {formatDuration(totalDuration)}
                        </div>
                        <div className="Description">
                            {playlistData.description}
                        </div>
                    </div>
                </div>
                {
                    songsLoaded && (
                        <div className="Songs">
                            {
                                songs.length > 0 ? (
                                    songs.map((song: any, i) => (
                                        <Song
                                            key={i}
                                            song={song}
                                            playlist={params.playlist_id}
                                            trackNumber={i + 1}
                                            selectSong={selectSong}
                                            songs={songs}
                                        />
                                    ))
                                ) : (
                                    <div className="UI-ErrorMessage">
                                        {t('ups')}
                                    </div>
                                )
                            }
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default Playlist;
