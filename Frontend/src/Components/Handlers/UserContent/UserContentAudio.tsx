import { useAuth } from '../../../System/Hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { HandleTime, PlayButton } from '../../../System/Elements/MusicPlayer';
import { MusicCover, Slider } from '../../../UIKit';
import { useDispatch, useSelector } from 'react-redux';
import { addToQueue, setDesiredTime, setPlay, setSong } from '../../../Store/Slices/musicPlayer';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

const UserContentAudio = ({ className, song, canPay = true, count = 0 }) => {
    const { accountData } = useAuth();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const playerState = useSelector((state: any) => state.musicPlayer);

    const animations = {
        show: {
            opacity: 1,
            marginTop: 5,
            height: 'auto',
            transition: {
                duration: 0.1,
            },
        },
        hide: {
            opacity: 0,
            height: 0,
            marginTop: 0,
            transition: {
                duration: 0.1,
            },
        }
    };


    const togglePlay = () => {
        if (playerState.songData?.id !== song.id) {
            dispatch(
                addToQueue([song])
            );
            dispatch(setSong(song));
        }
        if (playerState.selected) {
            dispatch(setPlay(!playerState.playing));
        }
    };

    const changeTime = (newTime) => {
        dispatch(setDesiredTime(newTime));
    };

    const plural = (n: number, one: string, few: string, many: string) => {
        const mod100 = n % 100;
        const mod10 = n % 10;
        if (mod100 > 10 && mod100 < 20) return many;
        if (mod10 > 1 && mod10 < 5) return few;
        if (mod10 === 1) return one;
        return many;
    };

    return (
        <div className={classNames('UserContent-Audio', className)}>
            <MusicCover
                cover={song.cover}
                width={50}
                borderRadius={7}
                shadows={false}
            />
            {
                accountData && accountData.id ? (
                    song && song.id ? (
                        <>
                            <div className="Player">
                                <div className="Metadata">
                                    <div className="Title">{song.title}</div>
                                    <div className="Artist">{song.artist}</div>
                                </div>
                                <AnimatePresence>
                                    {
                                        (playerState.songData.id === song.id && playerState.playing) && (
                                            <motion.div
                                                className="SliderContainer"
                                                initial="hide"
                                                animate="show"
                                                exit="hide"
                                                variants={animations}
                                            >
                                                <div className="Time">
                                                    <HandleTime time={playerState.currentTime} />
                                                </div>
                                                <Slider
                                                    onChange={changeTime}
                                                    value={playerState.currentTime}
                                                    max={playerState.duration}
                                                />
                                                <div className="Time">
                                                    <HandleTime time={playerState.duration} />
                                                </div>
                                            </motion.div>
                                        )
                                    }
                                </AnimatePresence>
                            </div>
                            {
                                canPay ? (
                                    <PlayButton isPlaying={(playerState.songData.id === song.id && playerState.playing)} togglePlay={togglePlay} />
                                ) : (
                                    count > 0 && (
                                        <div className="SongsCount">
                                            {count} {plural(count, t('songs_single'), t('songs_plural_1'), t('songs_plural_2'))}
                                        </div>
                                    )
                                )
                            }
                        </>
                    ) : (
                        <div className="Error">Тут что-то было?</div>
                    )
                ) : (
                    <div className="Error">Создайте аккаунт, чтобы слушать</div>
                )
            }
        </div>
    );
}

export default UserContentAudio;