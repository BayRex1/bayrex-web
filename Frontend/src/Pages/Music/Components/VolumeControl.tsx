import { useState, useRef } from 'react';
import Slider from '../../../UIKit/Components/Player/Slider.tsx';
import { VolumeControlButton } from '../../../System/Elements/MusicPlayer';
import { useDispatch, useSelector } from 'react-redux';
import { setVolume } from '../../../Store/Slices/musicPlayer.ts';
import { I_VOLUME_MINUS, I_VOLUME_PLUS } from '../../../System/UI/IconPack.jsx';
import {AnimatePresence, motion} from "framer-motion";

export const VolumeControl = () => {
    const [volumeControlVisibility, setVolumeControlVisibility] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();
    const playerState = useSelector((state: any) => state.musicPlayer);

    const selectVolume = (newVolume: number) => {
        dispatch(setVolume(newVolume));
    };

    return (
        <div className='UI-VolumeControl'>
            <AnimatePresence>
            {volumeControlVisibility && (
                    <motion.div ref={sliderRef}
                                className='UI-VolumeControl__slider'
                                initial={{ opacity: 0, scale: 0.5, y: 60 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: 60 }}
                    >
                        <button onClick={() => selectVolume(Math.min(playerState.volume + 0.1, 1))} className='UI-VolumeControl__button'>
                            <I_VOLUME_PLUS />
                        </button>

                        <Slider
                            value={playerState.volume}
                            onChange={selectVolume}
                            vertical={true}
                            min={0}
                            max={1}
                            step={0.01}
                        />

                        <button onClick={() => selectVolume(Math.max(playerState.volume - 0.1, 0))} className='UI-VolumeControl__button'>
                            <I_VOLUME_MINUS />
                        </button>
                    </motion.div>
            )}
            </AnimatePresence>
            <VolumeControlButton
                onClick={() => setVolumeControlVisibility((prev) => !prev)}
            />
        </div>
    );
};
