import { useEffect, useRef, useState, useCallback, use } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { Video } from '../../../UIKit';
import { useDatabase } from '../../../System/Context/Database';
import useSettingsStore from '../../../Store/settingsStore';
import { useInView } from 'react-intersection-observer';
import { downloadBlob } from '../../../System/Elements/Function';
import { useModalsStore } from '../../../Store/modalsStore';
import { useTranslation } from 'react-i18next';

interface UserContentVideoProps {
    video: {
        file: string;
        size?: number;
    };
}

const UserContentVideo = ({ video }: UserContentVideoProps) => {
    const { wsClient } = useWebSocket();
    const db = useDatabase();
    const { autoVideoDownload } = useSettingsStore();
    const { openModal } = useModalsStore() as any;
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [downloadedBytes, setDownloadedBytes] = useState(0);
    const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
    const objectUrlRef = useRef<string | null>(null);
    const { ref: viewRef, inView: isViewed } = useInView({
        threshold: 0,
        triggerOnce: true
    });

    useEffect(() => {
        return () => {
            cancelRef.current.cancelled = true;

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, []);

    const clearTempChunks = useCallback(async () => {
        try {
            await db.files_chunks.where('file').equals(video.file).delete();
        } catch (_) { }
    }, [db, video.file]);

    const checkVideoCached = useCallback(async () => {
        if (isDownloading || isDownloaded) return;

        const cached = await db.files_cache.get(['posts/videos', video.file]);
        if (cached?.file_blob && cached.file_blob.size > 0) {

            const url = URL.createObjectURL(cached.file_blob);
            objectUrlRef.current = url;
            setVideoSrc(url);
            setIsDownloaded(true);
            return true;
        }
        return false;
    }, [db, video.file, isDownloading, isDownloaded]);

    const downloadVideoToDevice = async () => {
        try {
            const cached = await db.files_cache.get(['posts/videos', video.file]);
            if (cached?.file_blob && cached.file_blob.size > 0) {
                const fileName = video.file || 'video.mp4';
                downloadBlob(cached.file_blob, fileName);
            } else {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('error'),
                        message: 'Видео ещё не загружено. Сначала нажмите на превью для загрузки.'
                    }
                });
            }
        } catch (error) {
            openModal({
                type: 'alert',
                props: {
                    title: t('error'),
                    message: 'Ошибка при сохранении видео'
                }
            });
        }
    };

    const downloadVideo = useCallback(async () => {
        if (isDownloading || isDownloaded) return;
        setDownloadedBytes(0);
        setIsDownloading(true);
        cancelRef.current.cancelled = false;

        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
            setVideoSrc(null);
        }

        try {
            await clearTempChunks();

            let offset = 0;
            let isLastChunk = false;

            while (!isLastChunk && !cancelRef.current.cancelled) {
                let res;

                try {
                    res = await wsClient.send({
                        type: 'download',
                        action: 'file',
                        payload: { path: 'posts/videos', file: video.file, offset },
                    });
                } catch (sendErr) {
                    throw sendErr;
                }

                if (cancelRef.current.cancelled) {
                    setIsDownloading(false);
                    await clearTempChunks();
                    return;
                }

                if (res.status !== 200) {
                    throw new Error(`Статус ${res.status}`);
                }

                const chunkData: Uint8Array = res.buffer;

                await db.files_chunks.put({
                    id: `${video.file}-${offset}`,
                    path: 'posts/videos',
                    file: video.file,
                    offset,
                    binary: chunkData,
                });

                offset += chunkData.byteLength;
                isLastChunk = Boolean(res.is_last_chunk);
                setDownloadedBytes(prev => prev + chunkData.byteLength);
            }

            if (cancelRef.current.cancelled) {
                setIsDownloading(false);
                await clearTempChunks();
                return;
            }

            const ext = video.file.split('.').pop()?.toLowerCase() || 'mp4';
            const mimeType =
                ext === 'webm' ? 'video/webm' :
                    ext === 'ogg' ? 'video/ogg' :
                        'video/mp4';

            const chunks = await db.files_chunks.where('file').equals(video.file).sortBy('offset');
            const buffers = chunks.map(c => c.binary);
            const blob = new Blob(buffers, { type: mimeType });

            await db.files_chunks.where('file').equals(video.file).delete();

            await db.files_cache.put({
                path: 'posts/videos',
                file: video.file,
                file_blob: blob,
            });

            const url = URL.createObjectURL(blob);
            objectUrlRef.current = url;
            setVideoSrc(url);
            setIsDownloaded(true);
            setIsDownloading(false);

            if (videoRef.current) {
                videoRef.current.src = url;
                videoRef.current.muted = false;
            }

        } catch (err: any) {
            setIsDownloading(false);
            try {
                await clearTempChunks();
            } catch (_) { }
        }
    }, [
        video.file,
        wsClient,
        db,
        isDownloading,
        isDownloaded,
        clearTempChunks,
    ]);

    const handleClick = () => {
        setIsInitialized(true);
        if (!isDownloading && !isDownloaded) {
            downloadVideo();
        } else if (isDownloading) {
            cancelRef.current.cancelled = true;
        }
    };

    useEffect(() => {
        const initialize = async () => {
            if (await checkVideoCached()) {
                setIsInitialized(true);
                return;
            }
            if (autoVideoDownload) {
                setIsInitialized(true);
                downloadVideo();
            }
        };

        if (isViewed) {
            initialize();
        }
    }, [checkVideoCached, isViewed]);

    return (
        <>
            <Video
                ref={videoRef}
                src={videoSrc}
                isInitialized={isInitialized}
                isDownloading={isDownloading}
                isDownloaded={isDownloaded}
                totalBytes={video.size || 0}
                downloadedBytes={downloadedBytes}
                onClickLoader={handleClick}
                onDownload={downloadVideoToDevice}
            />
            <span style={{ position : 'absolute' }} ref={viewRef} />
        </>
    );
};

export default UserContentVideo;
