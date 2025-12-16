import {I_NEXT, I_VOLUME_PLUS} from '../UI/IconPack';
import { AnimatePresence, motion } from 'framer-motion';

export const PlayButton = ({ isPlaying, togglePlay }) => {
    const variants = {
        showed: {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            transition: { duration: 0.2 },
        },
        hidden: {
            opacity: 0,
            scale: 0.5,
            filter: 'blur(5px)',
            transition: { duration: 0.2 },
        },
    };

    return (
        <button onClick={togglePlay} className="UI-PlayButton">
            <AnimatePresence>
                {isPlaying ? (
                    <motion.svg
                        key="pause"
                        width="48"
                        height="48"
                        viewBox="0 0 448 512"
                        initial="hidden"
                        animate="showed"
                        exit="hidden"
                        variants={variants}
                    >
                        <path
                            d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"
                        />
                    </motion.svg>
                ) : (
                    <motion.svg
                        key="play"
                        width="48"
                        height="48"
                        viewBox="0 0 448 512"
                        initial="hidden"
                        animate="showed"
                        exit="hidden"
                        variants={variants}
                    >
                        <path
                            d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9v416.1c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
                        />
                    </motion.svg>
                )}
            </AnimatePresence>
        </button>
    );
};

export const BackButton = ({ onClick }) => {
    return (
        <button onClick={onClick} className="Back">
            <I_NEXT />
        </button>
    );
}

export const NextButton = ({ onClick }) => {
    return (
        <button onClick={onClick} className="Next">
            <I_NEXT />
        </button>
    );
};

export const HandleTime = ({ time }) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const VolumeControlButton = ({ onClick }) => {
    return (
        <button onClick={onClick} className="volume-control__button">
            <I_VOLUME_PLUS />
        </button>
    )
}