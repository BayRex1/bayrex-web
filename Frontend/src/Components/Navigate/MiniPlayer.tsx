import { useDispatch, useSelector } from 'react-redux';
import { BackButton, HandleTime, NextButton, PlayButton } from '../../System/Elements/MusicPlayer';
import { I_SEARCH } from '../../System/UI/IconPack';
import { nextSong, prevSong, setDesiredTime, setPlay } from '../../Store/Slices/musicPlayer';
import { motion } from 'framer-motion';
import { MusicCover, Slider } from '../../UIKit';

interface MusicPlayerState {
    selected: boolean;
    songData: {
        cover: any;
        title: string;
        artist: string;
        author: string;
    };
    playing: boolean;
    currentTime: number;
    duration: number;
}

interface MiniPlayerProps {
    setMode: Function;
    variants: any;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ setMode, variants }) => {
    const playerState = useSelector((state: { musicPlayer: MusicPlayerState }) => state.musicPlayer);
    const dispatch = useDispatch();

    const changeTime = (newTime) => {
        dispatch(setDesiredTime(newTime));
    };

    const togglePlay = () => {
        dispatch(setPlay(!playerState.playing));
    };

    return (
        <motion.div
            className="MiniPlayer"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
        >
            <div className="UI-MusicPlayer">
                <MusicCover
                    cover={playerState.songData.cover}
                    width={50}
                    borderRadius={8}
                    shadows={false}
                />
                <div className="Metadata">
                    <div className="Name">{playerState.songData.title}</div>
                    <div className="Author">{playerState.songData.artist}</div>
                    <div className="SliderContainer">
                        <div className="Duration">
                            <HandleTime time={playerState.currentTime} />
                        </div>
                        <Slider
                            onChange={changeTime}
                            value={playerState.currentTime}
                            max={playerState.duration}
                        />
                        <div className="Duration">
                            <HandleTime time={playerState.duration} />
                        </div>
                    </div>
                </div>
                <div className="Music-ControlButtons">
                    <BackButton onClick={() => { dispatch(prevSong()) }} />
                    <PlayButton isPlaying={playerState.playing} togglePlay={togglePlay} />
                    <NextButton onClick={() => { dispatch(nextSong()) }} />
                    <button className="SwitchButton" onClick={() => { setMode(0); }}>
                        <I_SEARCH />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default MiniPlayer;
