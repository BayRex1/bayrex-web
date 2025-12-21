import { useEffect, useState, useMemo, useRef, memo } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useDatabase } from '../../../System/Context/Database';
import classNames from 'classnames';
import { isEqual } from 'lodash';

interface NeoImageProps {
    image: any;
    lossless?: boolean;
    draggable?: boolean;
    style?: any;
    className?: any;
    onClick?: any;
    onError?: any;
    onLoaded?: any;
    gradientBackground?: boolean;
}

const imageUrlCache = new Map();

const NeoImage = ({ image, lossless = false, draggable = false, style, className, onClick, onError, onLoaded, gradientBackground = true }: NeoImageProps) => {
    const db = useDatabase();
    const { wsClient } = useWebSocket();

    const [loaded, setLoaded] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [inView, setInView] = useState(false);

    const imageId = useMemo(() => {
        if (!image) return null;
        return `${image.path}_${image.file}_${lossless ? 'lossless' : 'simple'}`;
    }, [image?.path, image?.file, lossless]);

    const containerRef = useRef<HTMLDivElement>(null);

    const containerStyle = useMemo<React.CSSProperties>(() => ({
        background: gradientBackground ? `linear-gradient(20deg, ${image?.aura}, rgb(161 157 177))` : 'none',
        ...style,
    }), [image?.aura, style, gradientBackground]);

    const downloadImage = async () => {
        if (!image || !imageId) return;

        if (imageUrlCache.has(imageId)) {
            const cachedUrl = imageUrlCache.get(imageId);
            setBlobUrl(cachedUrl);
            setLoaded(true);
            if (onLoaded) {
                onLoaded();
            }
            return;
        }

        try {
            const res = await wsClient.send({
                type: 'download',
                action: 'image',
                image: {
                    path: image.path,
                    file: image.file,
                    simple: image.simple
                },
                lossless: lossless
            });

            if (res.status === 200) {
                const fileBlob = res.file ? new Blob([res.file.buffer]) : null;
                const simpleBlob = new Blob([res.simple.buffer], { type: 'image/webp' });

                try {
                    await db.image_cache.put({
                        file: image.file,
                        aura: image.aura,
                        path: image.path,
                        simple: image.simple,
                        file_blob: fileBlob,
                        simple_blob: simpleBlob,
                    });
                } catch (dbError) {
                    console.error('Ошибка при сохранении в кэш:', dbError);
                }

                const objectBlob = (lossless && fileBlob) ? fileBlob : simpleBlob;
                const url = URL.createObjectURL(objectBlob);
                setBlobUrl(url);
                setLoaded(true);
                if (onLoaded) {
                    onLoaded();
                }

                imageUrlCache.set(imageId, url);
            } else {
                if (onError) {
                    onError();
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке изображения:', error);
        }
    };

    const loadImage = async () => {
        if (!image || !imageId) return;

        if (imageUrlCache.has(imageId)) {
            setBlobUrl(imageUrlCache.get(imageId));
            setLoaded(true);
            if (onLoaded) {
                onLoaded();
            }
            return;
        }

        try {
            const cached = await db.image_cache.get([image.path, image.file]);

            if (!cached) {
                return downloadImage();
            }

            if (lossless && !cached.file_blob) {
                return downloadImage();
            }

            const objectBlob = (lossless && cached.file_blob) ? cached.file_blob : cached.simple_blob;
            if (objectBlob) {
                const url = URL.createObjectURL(objectBlob);
                setBlobUrl(url);
                setLoaded(true);
                if (onLoaded) {
                    onLoaded();
                }
                imageUrlCache.set(imageId, url);
            } else {
                downloadImage();
            }
        } catch (error) {
            console.error('Ошибка при работе с кешом:', error);
            downloadImage();
        }
    };

    useEffect(() => {
        if (!inView || !imageId) return;

        if (!loaded || !blobUrl || !imageUrlCache.has(imageId)) {
            loadImage();
        }
    }, [inView, imageId, loaded]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        const el = containerRef.current;
        if (el) observer.observe(el);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        setLoaded(false);
        setBlobUrl(null);
    }, [image?.path, image?.file, lossless]);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    }

    return (
        <div
            ref={containerRef}
            className={classNames('UI-Neoimage', className)}
            style={containerStyle}
            onClick={handleClick}
        >
            {loaded && blobUrl && (
                <img
                    src={blobUrl}
                    draggable={draggable}
                    alt="NeoImage"
                    loading="lazy"
                />
            )}
        </div>
    );
};

export default memo(NeoImage, (a, b) =>
    a.image.path === b.image.path &&
    a.image.file === b.image.file &&
    a.lossless === b.lossless &&
    a.draggable === b.draggable &&
    a.className === b.className &&
    isEqual(a.style, b.style));
