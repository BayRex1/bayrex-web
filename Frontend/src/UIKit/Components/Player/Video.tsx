import { forwardRef, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Slider from './Slider';
import {
  I_FULLSCREEN,
  I_PLAY,
  I_SETTINGS,
  I_VOLUME_MINUS,
  I_VOLUME_PLUS,
  I_DOWNLOAD,
} from '../../../System/UI/IconPack';
import { HandleTime, PlayButton } from '../../../System/Elements/MusicPlayer';
import { useTranslation } from 'react-i18next';
import DownloadProgress from '../Loaders/DownloadProgress';

interface VideoProps {
  isInitialized?: boolean;
  isDownloaded?: boolean;
  isDownloading?: boolean;
  onClickLoader?: () => void;
  onDownload?: () => void;
  totalBytes?: number;
  downloadedBytes?: number;
  src: string | null;
}

const Video = forwardRef<HTMLVideoElement, VideoProps>(
  (
    { isInitialized = false, 
      isDownloaded = false, 
      isDownloading = false, 
      onClickLoader, 
      onDownload, 
      totalBytes = 0, 
      downloadedBytes = 0, 
      src },
    ref
  ) => {
    const { t } = useTranslation();
    const [isHover, setIsHover] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [volume, setVolume] = useState<number>(() => {
      const saved = localStorage.getItem('V-Volume');
      return saved !== null ? parseFloat(saved) : 1;
    });

    const playerRef = useRef<HTMLDivElement>(null);
    const videoRef = ref as React.RefObject<HTMLVideoElement>;
    const timerRef = useRef<number | null>(null);

    const variants = {
      hidden: { opacity: 0, filter: 'blur(3px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
    };

    const togglePlay = () => {
      const vid = videoRef.current;
      if (!vid) return;
      if (isPlaying) vid.pause();
      else vid.play();
      setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    };

    const changeTime = (newTime: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    const changeVolume = (newVolume: number) => {
      setVolume(newVolume);
      localStorage.setItem('V-Volume', String(newVolume));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleFullscreen = () => {
      if (!playerRef.current) return;
      if (!isFullscreen) {
        if (playerRef.current.requestFullscreen) {
          playerRef.current.requestFullscreen();
        } else if ((playerRef.current as any).mozRequestFullScreen) {
          (playerRef.current as any).mozRequestFullScreen();
        } else if ((playerRef.current as any).webkitRequestFullscreen) {
          (playerRef.current as any).webkitRequestFullscreen();
        } else if ((playerRef.current as any).msRequestFullscreen) {
          (playerRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    };

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.volume = volume;
      }
    }, [volume]);

    useEffect(() => {
      const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', onFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
      };
    }, []);

    useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, []);

    const handleMouseOver = () => {
      if (!isDownloaded) return;

      setIsHover(true);
      resetTimer();
    };

    const handleMouseLeave = () => {
      setIsHover(settingsOpen);
      resetTimer();
    };

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (!settingsOpen) {
        timerRef.current = window.setTimeout(() => {
          setIsHover(false);
        }, 2000);
      }
    };

    return (
      <div
        onMouseOver={handleMouseOver}
        onMouseLeave={handleMouseLeave}
        ref={playerRef}
        className='UserContent-Video'
      >
        {!isDownloaded && (
          <DownloadProgress
            size={55}
            totalBytes={totalBytes}
            downloadedBytes={downloadedBytes}
            isDownloading={isDownloading}
            isInitialized={isInitialized}
            onClick={onClickLoader}
          />
        )}

        <video
          ref={videoRef}
          src={src || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          controls={false}
          style={{ maxHeight: isFullscreen ? '100%' : undefined }}
          onEnded={handleEnded}
        />

        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              className='VideoInfo'
              variants={variants}
              initial='hidden'
              animate='visible'
              exit='hidden'
            >
              <I_PLAY />
              {t('video')}
            </motion.div>
          )}
          {settingsOpen && isHover && (
            <motion.div
              className='Settings'
              variants={variants}
              initial='hidden'
              animate='visible'
              exit='hidden'
              transition={{ duration: 0.3, ease: [0.43, 0.13, 0.28, 0.96] }}
            >
              <div className='Volume'>
                <I_VOLUME_MINUS />
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={changeVolume}
                />
                <I_VOLUME_PLUS />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className='Blur'
          variants={variants}
          initial='hidden'
          animate={isHover ? 'visible' : 'hidden'}
        />

        <motion.div
          className='Controls'
          variants={variants}
          initial='hidden'
          animate={isHover ? 'visible' : 'hidden'}
        >
          <PlayButton isPlaying={isPlaying} togglePlay={togglePlay} />
          <div className='Slider'>
            <Slider
              value={currentTime}
              max={duration}
              onChange={changeTime}
            />
            <div className='Duration'>
              <div>
                <HandleTime time={currentTime} />
              </div>
              <div>
                <HandleTime time={duration} />
              </div>
            </div>
          </div>
          {isDownloaded && onDownload && (
            <button className='DownloadButton' onClick={onDownload}>
              <I_DOWNLOAD />
            </button>
          )}
          <button
            className='SettingsButton'
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <I_SETTINGS />
          </button>
          <button className='FullscreenButton' onClick={handleFullscreen}>
            <I_FULLSCREEN />
          </button>
        </motion.div>
      </div>
    );
  }
);

export default Video;
