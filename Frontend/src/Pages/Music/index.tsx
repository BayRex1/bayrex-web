import { memo, useEffect, useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router';
import { PlayButton, NextButton, BackButton, HandleTime } from '../../System/Elements/MusicPlayer';
import { useDispatch, useSelector } from 'react-redux';
import { hideTopPanel, showTopPanel } from '../../Store/Slices/ui';
import FullPlayer from './Components/FullPlayer';
import { addToQueue, nextSong, prevSong, setDesiredTime, setPlay, setSong } from '../../Store/Slices/musicPlayer';
import { useTranslation } from 'react-i18next';
import { MusicCover, Slider } from '../../UIKit';
import Main from './Pages/Main';
import Playlist from './Pages/Playlist';
import { VolumeControl } from "./Components/VolumeControl.tsx";
import './Music.scss';

interface PlayerState {
    selected: boolean;
    songData: any;
    playing: boolean;
    currentTime: number;
}

const Music: React.FC = memo(() => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const params = useParams<{ song_id: string }>();
    const navigate = useNavigate();
    const playerState: PlayerState = useSelector((state: any) => state.musicPlayer);
    const [playerOpen, setPlayerOpen] = useState<boolean>(false);

    const selectSong = (song: any, queue: any | null, playlist) => {
        if (queue) {
            dispatch(
                addToQueue(
                    queue.map((song) => ({
                        id: song.id,
                        title: song.title,
                        artist: song.artist,
                        cover: song.cover,
                        liked: song.liked,
                        duration: song.duration
                    }))
                )
            );
        }
        dispatch(
            setSong({
                id: song.id,
                title: song.title,
                artist: song.artist,
                cover: song.cover,
                liked: song.liked,
                duration: song.duration
            })
        );
        if (Number(params.song_id) !== song.id && !playlist) {
            navigate(`/music/id/${song.id}`);
        } else {
            if (playlist) {
                navigate(`/music/playlist/${playlist}/${song.id}`);
            }
        }
    };

    useEffect(() => {
        console.log(playerState.songData.duration);
    }, [playerState.songData.duration])

    const openPlayer = () => {
        if (playerState.selected) {
            setPlayerOpen(true);
            dispatch(hideTopPanel());
        }
    };

    const closePlayer = () => {
        setPlayerOpen(false);
        dispatch(showTopPanel());
    };

    const togglePlay = () => {
        if (playerState.selected) {
            dispatch(setPlay(!playerState.playing));
        }
    };

    const changeTime = (newTime) => {
        dispatch(setDesiredTime(newTime));
    };

    return (
        <>
            <div className="UI-ScrollView">
                <Routes>
                    <Route path="/" element={<Main selectSong={selectSong} />} />
                    <Route path="id/:song_id" element={<Main selectSong={selectSong} />} />
                    <Route path="playlist/:playlist_id" element={<Playlist selectSong={selectSong} />} />
                    <Route path="playlist/:playlist_id/:song_id" element={<Playlist selectSong={selectSong} />} />
                </Routes>
                <div className="UI-EmailInfo" style={{ marginBottom: '150px' }}>
                    {t('music_copyright')} - elemsupport@proton.me
                </div>
            </div>

            {/* Мини-плеер */}
            {
                playerState.selected && (
                    <>
                        <div className="Music-MiniPlayer">
                            <div className="UI-MusicPlayer">
                                <MusicCover
                                    cover={playerState.songData.cover}
                                    width={50}
                                    borderRadius={5}
                                    shadows={false}
                                    onClick={openPlayer}
                                />
                                <div className="Metadata">
                                    <div onClick={openPlayer} className="Name">
                                        {playerState.songData.title}
                                    </div>
                                    <div className="Author">{playerState.songData.artist}</div>
                                    <div className="SliderContainer">
                                        <div className="Duration">
                                            <HandleTime time={playerState.currentTime} />
                                        </div>
                                        <Slider
                                            onChange={changeTime}
                                            value={playerState.currentTime}
                                            max={playerState.songData.duration}
                                        />
                                        <div className="Duration">
                                            <HandleTime time={playerState.songData.duration} />
                                        </div>
                                    </div>
                                </div>
                                <div className="Music-ControlButtons">
                                    <BackButton onClick={() => dispatch(prevSong())} />
                                    <PlayButton isPlaying={playerState.playing} togglePlay={togglePlay} />
                                    <NextButton onClick={() => dispatch(nextSong())} />
                                    <VolumeControl />
                                </div>
                            </div>
                        </div>
                    </>

                )
            }

            {/* Полноценный плеер */}
            <FullPlayer
                isOpen={playerOpen}
                close={closePlayer}
                changeTime={changeTime}
            />
        </>
    );
});

export default Music;
