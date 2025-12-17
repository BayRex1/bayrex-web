import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDuration, setCurrentTime, setPlay, nextSong, prevSong } from '../Store/Slices/musicPlayer.ts';
import { useWebSocket } from '../System/Context/WebSocket.jsx';
import { useDatabase } from '../System/Context/Database.tsx';

const musicUrlCache = new Map();

const AudioPlayer = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const loadingRef = useRef<boolean>(false);
    const currentBlobRef = useRef<string | null>(null);
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const queueRef = useRef<ArrayBuffer[]>([]);
    const offsetRef = useRef<number>(0);
    const totalSizeRef = useRef<number>(0);

    const dispatch = useDispatch();
    const { songData, playing, loop, desiredTime, volume, currentSongIndex, songsQueue } = useSelector((state: any) => state.musicPlayer);
    const { wsClient } = useWebSocket();
    const db = useDatabase();

    const downloadMusic = async () => {
        if (!songData?.id) return;

        initMediaSource();
    };

    const loadMusic = async () => {
        if (!songData?.id) return;

        const musicId = `music_${songData.id}`;

        if (musicUrlCache.has(musicId)) {
            const cachedUrl = musicUrlCache.get(musicId);
            loadFromUrl(cachedUrl);
            return;
        }

        try {
            const cached = await db.music_cache.get(songData.id);

            if (!cached || !cached.file_blob) {
                return downloadMusic();
            }

            const url = URL.createObjectURL(cached.file_blob);

            musicUrlCache.set(musicId, url);
            loadFromUrl(url);

        } catch (error) {
            downloadMusic();
        }
    };

    const loadFromUrl = (url: string) => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();

            audio.onloadedmetadata = null;

            const playPromise = () => {
                if (playing) {
                    audio.play().catch(() => { });
                }
            };

            audio.src = url;

            audio.addEventListener('loadedmetadata', () => {
                playPromise();
            }, { once: true });

            audio.addEventListener('error', () => { }, { once: true });

            audio.load();

            setTimeout(() => {
                if (audio.readyState >= 1) {
                    playPromise();
                }
            }, 200);
        }

        currentBlobRef.current = url;
    };

    const allChunksRef = useRef<ArrayBuffer[]>([]);

    const saveMusicToCache = async () => {
        if (!songData?.id || allChunksRef.current.length === 0) return;

        try {
            let totalSize = 0;
            for (const chunk of allChunksRef.current) {
                totalSize += chunk.byteLength;
            }

            const totalData = new Uint8Array(totalSize);
            let offset = 0;

            for (const chunk of allChunksRef.current) {
                const chunkArray = new Uint8Array(chunk);
                totalData.set(chunkArray, offset);
                offset += chunkArray.length;
            }

            const blob = new Blob([totalData], { type: 'audio/mpeg' });

            try {
                await db.music_cache.put({
                    song_id: songData.id,
                    file_blob: blob
                });

                const musicId = `music_${songData.id}`;
                const url = URL.createObjectURL(blob);
                musicUrlCache.set(musicId, url);

            } catch (dbError) {
            }

        } catch (error) {
        }
    };

    const feedBuffer = () => {
        const sourceBuffer = sourceBufferRef.current;
        if (!sourceBuffer || sourceBuffer.updating || !queueRef.current.length) return;

        const chunk = queueRef.current.shift();
        if (chunk) {
            try {
                sourceBuffer.appendBuffer(chunk);
                if (audioRef.current && audioRef.current.paused && playing) {
                    audioRef.current.play();
                }
            } catch (e) {
            }
        }

        if (queueRef.current.length < 2 && offsetRef.current < totalSizeRef.current && !loadingRef.current) {
            fetchChunk();
        }
    };

    const initMediaSource = () => {
        resetPlayer();

        const mediaSource = new MediaSource();
        mediaSourceRef.current = mediaSource;

        mediaSource.addEventListener("sourceopen", () => {
            if (!mediaSource.sourceBuffers.length) {
                sourceBufferRef.current = mediaSource.addSourceBuffer("audio/mpeg");

                sourceBufferRef.current.addEventListener("updateend", () => {
                    loadingRef.current = false;

                    if (totalSizeRef.current > 0 && offsetRef.current >= totalSizeRef.current && mediaSource.readyState === 'open') {
                        try {
                            mediaSource.endOfStream();
                        } catch (e) {
                        }
                    }

                    feedBuffer();

                    if (queueRef.current.length < 2 && offsetRef.current < totalSizeRef.current) {
                        fetchChunk();
                    }
                });

                offsetRef.current = 0;
                totalSizeRef.current = 0;
                queueRef.current = [];
                allChunksRef.current = [];

                fetchChunk();
            }
        });

        const audio = audioRef.current;
        if (audio) {
            audio.src = URL.createObjectURL(mediaSource);
            audio.load();
        }
    };

    const fetchChunk = async () => {
        if (loadingRef.current || !songData?.id) return;
        loadingRef.current = true;

        try {
            const res: any = await wsClient.send({
                type: 'download',
                action: 'music',
                payload: {
                    song_id: songData.id,
                    offset: offsetRef.current
                }
            });

            if (res.status === 200 && res.buffer) {
                const chunk = new ArrayBuffer(res.buffer.byteLength);
                new Uint8Array(chunk).set(new Uint8Array(res.buffer));

                queueRef.current.push(chunk);
                allChunksRef.current.push(chunk.slice(0));

                totalSizeRef.current = res.total_size;
                offsetRef.current = offsetRef.current + chunk.byteLength;

                if (res.is_last_chunk) {
                    saveMusicToCache();
                }
                feedBuffer();
            }
        } catch (error) {
        } finally {
            loadingRef.current = false;
        }
    };


    const resetPlayer = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        }

        // Don't revoke blob URLs that are cached
        currentBlobRef.current = null;

        if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
            try {
                mediaSourceRef.current.endOfStream();
            } catch (e) {
            }
        }

        mediaSourceRef.current = null;
        sourceBufferRef.current = null;
        queueRef.current = [];
        allChunksRef.current = [];
        offsetRef.current = 0;
        totalSizeRef.current = 0;
        loadingRef.current = false;
    };

    useEffect(() => {
        if (!songData?.id) return;
        resetPlayer();
        loadMusic();
    }, [songData.id]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
        if (audioRef.current) {
            if (playing) audioRef.current.play().catch(() => { });
            else audioRef.current.pause();
        }
    }, [playing]);

    useEffect(() => {
        if (audioRef.current && desiredTime !== null && isFinite(desiredTime) && desiredTime >= 0) {
            audioRef.current.currentTime = desiredTime;
        }
    }, [desiredTime]);

    useEffect(() => {
        if ('mediaSession' in navigator && songData) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: songData.title || 'Неизвестный трек',
                artist: songData.artist || 'Неизвестный исполнитель',
                album: songData.album || '',
            });

            navigator.mediaSession.setActionHandler('play', () => dispatch(setPlay(true)));
            navigator.mediaSession.setActionHandler('pause', () => dispatch(setPlay(false)));
            navigator.mediaSession.setActionHandler('previoustrack', () => dispatch(prevSong()));
            navigator.mediaSession.setActionHandler('nexttrack', () => dispatch(nextSong()));
        }
    }, [songData]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const currentTime = audioRef.current.currentTime;
            const duration = audioRef.current.duration;

            if (isFinite(currentTime) && currentTime >= 0) {
                dispatch(setCurrentTime(currentTime));
            }

            if (isFinite(duration) && duration > 0) {
                dispatch(setDuration(duration));
            }
        }
    };

    const handleLoadedMeta = () => {
        if (audioRef.current) {
            const duration = audioRef.current.duration;
            if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                dispatch(setDuration(duration));
            }
        }
    };

    const handleEnded = () => {
        if (currentSongIndex < songsQueue.length - 1) dispatch(nextSong());
        else {
            dispatch(setPlay(false));
            dispatch(setCurrentTime(0));
        }
    };

    return (
        <audio
            ref={audioRef}
            loop={loop}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMeta}
            onEnded={handleEnded}
            controls={false}
        />
    );
};

export default AudioPlayer;
