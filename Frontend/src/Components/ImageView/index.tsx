import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { I_DOTS, I_DOWNLOAD } from '../../System/UI/IconPack';
import { HandleFileSize } from '../../System/Elements/Handlers';
import { useDispatch, useSelector } from 'react-redux';
import { setImage, setImages, setOpen } from '../../Store/Slices/imageView';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import NeoImage from '../../UIKit/Components/Base/NeoImage';
import { useDatabase } from '../../System/Context/Database';
import { downloadBlob } from '../../System/Elements/Function';
import { GovernButtons } from '../../UIKit';

const SMOOTHING_FACTOR = 0.4;
const DOUBLE_TAP_ZOOM = 2.0;
const DOUBLE_TAP_DELAY = 300;
const ANIMATION_DURATION = 0.25;
const MIN_SCALE = 1.0;
const MAX_SCALE = 3.0;
const SCALE_THRESHOLD = 0.05;

interface Position {
    x: number;
    y: number;
}

interface ImageDimensions {
    width: number;
    height: number;
}

interface NeoImageFile {
    path: string;
    file: string;
}

interface ImageMetadata {
    file_name: string;
    file_size?: number;
}

interface ImageViewImage {
    file_path?: string | null;
    neo_file?: NeoImageFile;
    metadata: ImageMetadata;
}

interface ImageViewState {
    isOpen: boolean;
    selected: ImageViewImage;
    images: ImageViewImage[];
}

interface TopBarProps {
    selected: ImageViewImage;
    onClose: () => void;
}

interface BottomBarProps {
    images: ImageViewImage[];
    selected: ImageViewImage;
    onSelectImage: (image: ImageViewImage) => void;
}

interface ImageContentProps {
    selected: ImageViewImage;
    onClose: () => void;
}

const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const calculateMidpoint = (touch1: React.Touch, touch2: React.Touch): Position => {
    return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
    };
};

const TopBar = memo(({ selected, onClose }: TopBarProps) => {
    const { t } = useTranslation();
    const db = useDatabase();
    const [gbOpen, setGbOpen] = useState<boolean>(false);
    
    const downloadFile = useCallback(async () => {
        try {
            if (selected.file_path) {
                const response = await fetch(selected.file_path);
                if (!response.ok) throw new Error(`Ошибка загрузки: ${response.statusText}`);

                const blob = await response.blob();
                downloadBlob(blob, selected.metadata.file_name);
            } else if (selected.neo_file) {
                const image = selected.neo_file;
                const cached = await db.image_cache.get([image.path, image.file]);

                if (cached) {
                    const blob = cached.file_blob ? cached.file_blob : cached.simple_blob;
                    downloadBlob(blob, image.file);
                } else {
                    console.error('Файл не найден в кеше');
                }
            }
        } catch (error) {
            console.error('Ошибка скачивания файла:', error);
        }
    }, [selected, db.image_cache]);

    const govern = useMemo(() => [
        {
            title: t('download'),
            icon: <I_DOWNLOAD />,
            onClick: downloadFile
        }
    ], [t, downloadFile]);

    return (
        <motion.div
            className="TopBar"
            initial={{ y: -200 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.1 }}
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 10 }}
        >
            <div className="Metadata">
                <div className="Name">
                    {selected.metadata.file_name ? selected.metadata.file_name : 'Без метаданных'}
                </div>
                {
                    selected.metadata.file_size && (
                        <>
                            •
                            <div className="Size">
                                <HandleFileSize bytes={selected.metadata.file_size} />
                            </div>
                        </>
                    )
                }
                <div className="Govern">
                    <button className="Dots" onClick={() => { setGbOpen(!gbOpen) }}>
                        <I_DOTS />
                    </button>
                    <GovernButtons isOpen={gbOpen} setIsOpen={setGbOpen} buttons={govern} />
                </div>
            </div>
        </motion.div>
    );
});

const BottomBar = memo(({ images, selected, onSelectImage }: BottomBarProps) => {
    return (
        <motion.div
            className="BottomBar"
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.1 }}
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 10 }}
        >
            <div className="Scroll">
                <div className="Images">
                    {images.map((image, i) => (
                        <motion.div
                            key={i}
                            className={classNames('Image', 
                                (selected.file_path === image.file_path || 
                                (selected.neo_file && image.neo_file && 
                                 selected.neo_file.file === image.neo_file.file && 
                                 selected.neo_file.path === image.neo_file.path)) && 
                                'Selected'
                            )}
                            onClick={() => onSelectImage(image)}
                        >
                            {image.file_path ? (
                                <img src={image.file_path} alt="" />
                            ) : (
                                <NeoImage image={image.neo_file} lossless={false} />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
});

const ImageContent = memo(({ selected, onClose }: ImageContentProps) => {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const startPosition = useRef<Position | null>(null);
    const [scale, setScale] = useState<number>(1);
    const [animatingScale, setAnimatingScale] = useState<boolean>(false);
    const [touchDistance, setTouchDistance] = useState<number | null>(null);
    const imageRef = useRef<HTMLDivElement>(null);
    const imageImgRef = useRef<HTMLImageElement>(null);
    const [dragging, setDragging] = useState<boolean>(false);
    const [isZoomed, setIsZoomed] = useState<boolean>(false);

    const lastTapRef = useRef<number>(0);
    const lastTapPositionRef = useRef<Position>({ x: 0, y: 0 });
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [maxBounds, setMaxBounds] = useState<Position>({ x: 0, y: 0 });
    const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const lastMoveTimeRef = useRef<number>(Date.now());
    const lastMovePositionRef = useRef<Position | null>(null);

    const velocityRef = useRef<Position>({ x: 0, y: 0 });
    const inertiaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updateImageDimensions = useCallback(() => {
        if (containerRef.current) {
            let imgElement: HTMLElement | null = null;

            if (imageImgRef.current) {
                imgElement = imageImgRef.current;
            } else if (imageRef.current) {
                imgElement = imageRef.current.querySelector('img');
            }

            if (imgElement) {
                const rect = imgElement.getBoundingClientRect();
                setImageDimensions({ width: rect.width, height: rect.height });

                const containerRect = containerRef.current.getBoundingClientRect();
                setMaxBounds({
                    x: Math.max(0, (rect.width * scale - containerRect.width) / 2),
                    y: Math.max(0, (rect.height * scale - containerRect.height) / 2)
                });
            }
        }
    }, [scale]);

    const clampPosition = useCallback(() => {
        if (scale > 1 && containerRef.current && (imageImgRef.current || imageRef.current)) {
            const imgElement = imageImgRef.current || (imageRef.current ? imageRef.current.querySelector('img') : null);
            if (!imgElement) return;

            const imgRect = imgElement.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();

            const maxX = Math.max(0, (imgRect.width * scale - containerRect.width) / 2);
            const maxY = Math.max(0, (imgRect.height * scale - containerRect.height) / 2);

            setPosition(prev => ({
                x: Math.min(Math.max(prev.x, -maxX), maxX),
                y: Math.min(Math.max(prev.y, -maxY), maxY),
            }));
        }
    }, [scale]);

    const autoCorrectScale = useCallback((currentScale: number): number => {
        if (Math.abs(currentScale - MIN_SCALE) < SCALE_THRESHOLD) {
            return MIN_SCALE;
        }
        if (Math.abs(currentScale - MAX_SCALE) < SCALE_THRESHOLD) {
            return MAX_SCALE;
        }
        return currentScale;
    }, []);

    const animateScale = useCallback(
        (targetScale: number, point: Position) => {
            if (animatingScale) return;

            const currentElement = imageImgRef.current || imageRef.current;
            if (!currentElement) return;

            targetScale = Math.max(MIN_SCALE, Math.min(targetScale, MAX_SCALE));
            targetScale = autoCorrectScale(targetScale);

            const rect = currentElement.getBoundingClientRect();
            const normX = (point.x - rect.left - rect.width / 2) / (rect.width / 2);
            const normY = (point.y - rect.top - rect.height / 2) / (rect.height / 2);

            const oldScale = scale;
            if (targetScale === oldScale) return;

            setAnimatingScale(true);
            const scaleChange = targetScale / oldScale;

            const finalDeltaX = normX * rect.width * (scaleChange - 1) / 2;
            const finalDeltaY = normY * rect.height * (scaleChange - 1) / 2;

            const finalX = targetScale > 1 ? position.x - finalDeltaX : 0;
            const finalY = targetScale > 1 ? position.y - finalDeltaY : 0;

            const startTime = Date.now();
            const duration = ANIMATION_DURATION * 1000;

            const animateFrame = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeInOutCubic(progress);

                setScale(oldScale + (targetScale - oldScale) * easedProgress);
                setPosition({
                    x: position.x + (finalX - position.x) * easedProgress,
                    y: position.y + (finalY - position.y) * easedProgress,
                });

                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    setAnimatingScale(false);
                    setTimeout(() => {
                        updateImageDimensions();
                        if (targetScale > 1) {
                            setIsZoomed(true);
                            clampPosition();
                        } else {
                            setIsZoomed(false);
                        }
                    }, 10);
                }
            };

            requestAnimationFrame(animateFrame);
        },
        [animatingScale, scale, position, updateImageDimensions, clampPosition, autoCorrectScale]
    );

    const handleDoubleTap = useCallback((event: MouseEvent | TouchEvent): boolean => {
        const now = Date.now();
        const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
        const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;

        const tapPosition = { x: clientX, y: clientY };
        const distanceSquared =
            Math.pow(tapPosition.x - lastTapPositionRef.current.x, 2) +
            Math.pow(tapPosition.y - lastTapPositionRef.current.y, 2);

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY && distanceSquared < 1000) {
            animateScale(scale > 1 ? 1 : DOUBLE_TAP_ZOOM, tapPosition);
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
                tapTimeoutRef.current = null;
            }
            lastTapRef.current = 0;
            return true;
        }

        lastTapRef.current = now;
        lastTapPositionRef.current = tapPosition;
        
        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
        }
        
        return false;
    }, [scale, animateScale]);

    const handleMouseDown = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        
        if (animatingScale) {
            event.stopPropagation();
            return;
        }

        if (handleDoubleTap(event.nativeEvent)) {
            event.stopPropagation();
            return;
        }

        startPosition.current = { x: event.clientX, y: event.clientY };
        setDragging(true);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [animatingScale, handleDoubleTap]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (animatingScale || !startPosition.current) return;

        const deltaX = event.clientX - startPosition.current.x;
        const deltaY = event.clientY - startPosition.current.y;

        setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        startPosition.current = { x: event.clientX, y: event.clientY };

        if (containerRef.current && (imageImgRef.current || imageRef.current)) {
            const imgElement = imageImgRef.current || (imageRef.current ? imageRef.current.querySelector('img') : null);
            if (imgElement) {
                const imgRect = imgElement.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();

                const visibleWidth = Math.min(imgRect.right, containerRect.right) - Math.max(imgRect.left, containerRect.left);
                const visibleHeight = Math.min(imgRect.bottom, containerRect.bottom) - Math.max(imgRect.top, containerRect.top);

                const visibleArea = visibleWidth * visibleHeight;
                const imgArea = imgRect.width * imgRect.height;
                const visiblePercentage = visibleArea / imgArea;

                if (visiblePercentage < 0.2) {
                    onClose();
                    return;
                }
            }
        }

        if (scale > 1) clampPosition();
    }, [scale, clampPosition, onClose]);

    const handleMouseUp = useCallback((event: MouseEvent) => {
        startPosition.current = null;
        setDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);



    const handleTouchStart = useCallback((event: React.TouchEvent) => {
        if (animatingScale) return;

        lastMoveTimeRef.current = Date.now();
        lastMovePositionRef.current = null;

        if (event.touches.length === 1) {
            if (handleDoubleTap(event.nativeEvent)) {
                event.stopPropagation();
                return;
            }

            startPosition.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            setDragging(true);
        } else if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            setTouchDistance(Math.sqrt(dx * dx + dy * dy));
        }
    }, [animatingScale, handleDoubleTap]);

    const handleTouchMove = useCallback((event: React.TouchEvent) => {
        if (animatingScale) return;

        const now = Date.now();
        const currentTouch = event.touches[0];
        const currentPosition = { x: currentTouch.clientX, y: currentTouch.clientY };

        if (event.touches.length === 2 && touchDistance !== null) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            const newDistance = Math.sqrt(dx * dx + dy * dy);

            const midpoint = calculateMidpoint(touch1, touch2);

            const currentElement = imageImgRef.current || imageRef.current;
            if (currentElement) {
                const rect = currentElement.getBoundingClientRect();

                const normX = (midpoint.x - rect.left - rect.width / 2) / (rect.width / 2);
                const normY = (midpoint.y - rect.top - rect.height / 2) / (rect.height / 2);

                const oldScale = scale;
                const scaleFactor = 1 + (newDistance / touchDistance - 1) * SMOOTHING_FACTOR;
                let newScale = oldScale * scaleFactor;
                newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
                newScale = autoCorrectScale(newScale);

                if (newScale !== oldScale) {
                    const scaleChange = newScale / oldScale;

                    const deltaX = normX * rect.width * (scaleChange - 1) / 2;
                    const deltaY = normY * rect.height * (scaleChange - 1) / 2;

                    setScale(newScale);

                    if (newScale > 1) {
                        setPosition(prev => ({ x: prev.x - deltaX, y: prev.y - deltaY }));

                        setTimeout(() => {
                            updateImageDimensions();
                            clampPosition();
                            
                            if (containerRef.current) {
                                const imgElement = currentElement.querySelector('img') || currentElement;
                                if (imgElement) {
                                    const imgRect = imgElement.getBoundingClientRect();
                                    const containerRect = containerRef.current.getBoundingClientRect();
                                    
                                    const visibleWidth = Math.min(imgRect.right, containerRect.right) - Math.max(imgRect.left, containerRect.left);
                                    const visibleHeight = Math.min(imgRect.bottom, containerRect.bottom) - Math.max(imgRect.top, containerRect.top);
                                    
                                    const visibleArea = visibleWidth * visibleHeight;
                                    const imgArea = imgRect.width * imgRect.height;
                                    const visiblePercentage = visibleArea / imgArea;
                                    
                                    if (visiblePercentage < 0.15) {
                                        onClose();
                                    }
                                }
                            }
                        }, 0);
                    } else {
                        setPosition({ x: 0, y: 0 });
                    }
                }
            }

            setTouchDistance(newDistance);
        } else if (event.touches.length === 1) {
            const touch = event.touches[0];

            if (startPosition.current && startPosition.current.x !== null && startPosition.current.y !== null) {
                const deltaX = touch.clientX - startPosition.current.x;
                const deltaY = touch.clientY - startPosition.current.y;

                if (scale <= 1 && lastMovePositionRef.current) {
                    const timeDiff = now - lastMoveTimeRef.current;
                    const speedX = Math.abs(currentPosition.x - lastMovePositionRef.current.x) / timeDiff;
                    const speedY = Math.abs(currentPosition.y - lastMovePositionRef.current.y) / timeDiff;
                    const speed = Math.sqrt(speedX * speedX + speedY * speedY);

                    const distanceX = Math.abs(currentPosition.x - startPosition.current.x);
                    const distanceY = Math.abs(currentPosition.y - startPosition.current.y);
                    const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                    if (speed > 1.5 && totalDistance > 100) {
                        onClose();
                        return;
                    }
                }

                setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));

                startPosition.current = { x: touch.clientX, y: touch.clientY };

                if (containerRef.current && (imageImgRef.current || imageRef.current)) {
                    const imgElement = imageImgRef.current || (imageRef.current ? imageRef.current.querySelector('img') : null);
                    if (imgElement) {
                        const imgRect = imgElement.getBoundingClientRect();
                        const containerRect = containerRef.current.getBoundingClientRect();

                        const visibleWidth = Math.min(imgRect.right, containerRect.right) - Math.max(imgRect.left, containerRect.left);
                        const visibleHeight = Math.min(imgRect.bottom, containerRect.bottom) - Math.max(imgRect.top, containerRect.top);

                        const visibleArea = visibleWidth * visibleHeight;
                        const imgArea = imgRect.width * imgRect.height;
                        const visiblePercentage = visibleArea / imgArea;

                        if (visiblePercentage < 0.2) {
                            onClose();
                            return;
                        }
                    }
                }

                if (scale > 1) {
                    clampPosition();
                }

                lastMoveTimeRef.current = now;
                lastMovePositionRef.current = currentPosition;
            }
        }
    }, [animatingScale, scale, touchDistance, updateImageDimensions, clampPosition, onClose, autoCorrectScale]);

    const applyInertia = useCallback(() => {
        if (!velocityRef.current) return;

        if (scale <= 1) {
            setPosition(prev => ({
                x: prev.x + velocityRef.current.x,
                y: prev.y + velocityRef.current.y
            }));

            velocityRef.current = {
                x: velocityRef.current.x * 0.95,
                y: velocityRef.current.y * 0.95
            };

            if (containerRef.current && (imageImgRef.current || imageRef.current)) {
                const imgElement = imageImgRef.current || (imageRef.current ? imageRef.current.querySelector('img') : null);
                if (imgElement) {
                    const imgRect = imgElement.getBoundingClientRect();
                    const containerRect = containerRef.current.getBoundingClientRect();

                    const leftEdge = imgRect.left;
                    const rightEdge = imgRect.right;
                    const topEdge = imgRect.top;
                    const bottomEdge = imgRect.bottom;

                    if (
                        leftEdge > containerRect.right ||
                        rightEdge < containerRect.left ||
                        topEdge > containerRect.bottom ||
                        bottomEdge < containerRect.top ||
                        leftEdge < -imgRect.width * 0.6 ||
                        rightEdge > containerRect.right + imgRect.width * 0.6 ||
                        topEdge < -imgRect.height * 0.6 ||
                        bottomEdge > containerRect.bottom + imgRect.height * 0.6
                    ) {
                        onClose();
                        return;
                    }
                }
            }

            if (Math.abs(velocityRef.current.x) > 0.5 || Math.abs(velocityRef.current.y) > 0.5) {
                if (inertiaTimeoutRef.current) clearTimeout(inertiaTimeoutRef.current);
                inertiaTimeoutRef.current = setTimeout(applyInertia, 16); // ~60fps
            } else {
                velocityRef.current = { x: 0, y: 0 };
                if (inertiaTimeoutRef.current) {
                    clearTimeout(inertiaTimeoutRef.current);
                    inertiaTimeoutRef.current = null;
                }
            }
        } else {
            velocityRef.current = { x: 0, y: 0 };
        }
    }, [scale, onClose]);

    const handleTouchEnd = useCallback((event: React.TouchEvent) => {
        if (event.touches.length < 2) {
            setTouchDistance(null);
        }

        if (event.touches.length === 0) {
            if (scale <= 1 && containerRef.current && (imageImgRef.current || imageRef.current)) {
                const imgElement = imageImgRef.current || (imageRef.current ? imageRef.current.querySelector('img') : null);
                if (imgElement) {
                    const imgRect = imgElement.getBoundingClientRect();
                    const containerRect = containerRef.current.getBoundingClientRect();

                    const leftEdge = imgRect.left;
                    const rightEdge = imgRect.right;
                    const topEdge = imgRect.top;
                    const bottomEdge = imgRect.bottom;

                    if (
                        leftEdge > containerRect.right ||
                        rightEdge < containerRect.left ||
                        topEdge > containerRect.bottom ||
                        bottomEdge < containerRect.top
                    ) {
                        onClose();
                        return;
                    }

                    const visibleWidth = Math.min(imgRect.right, containerRect.right) - Math.max(imgRect.left, containerRect.left);
                    const visibleHeight = Math.min(imgRect.bottom, containerRect.bottom) - Math.max(imgRect.top, containerRect.top);

                    const visibleArea = visibleWidth * visibleHeight;
                    const imgArea = imgRect.width * imgRect.height;
                    const visiblePercentage = visibleArea / imgArea;

                    if (visiblePercentage < 0.4) {
                        onClose();
                        return;
                    }
                }
            }

            if (scale <= 1 && lastMovePositionRef.current && startPosition.current) {
                const now = Date.now();
                const timeDiff = now - lastMoveTimeRef.current;

                if (timeDiff < 100) {
                    const speedX = (lastMovePositionRef.current.x - startPosition.current.x) / timeDiff;
                    const speedY = (lastMovePositionRef.current.y - startPosition.current.y) / timeDiff;

                    velocityRef.current = { x: speedX * 50, y: speedY * 50 };

                    if (inertiaTimeoutRef.current) {
                        clearTimeout(inertiaTimeoutRef.current);
                        inertiaTimeoutRef.current = null;
                    }
                    applyInertia();
                }
            }

            startPosition.current = null;
            setDragging(false);
        }
    }, [scale, onClose, applyInertia]);

    useEffect(() => {
        if (scale < 1) {
            setScale(1);
            setIsZoomed(false);
        } else if (scale > 1) {
            setIsZoomed(true);
        } else {
            setIsZoomed(false);
        }
        updateImageDimensions();
    }, [scale, updateImageDimensions]);

    useEffect(() => {
        if (imageImgRef.current || imageRef.current) {
            const imgElement = imageImgRef.current || (imageRef.current ? imageRef.current.querySelector('img') : null);

            if (imgElement) {
                imgElement.onload = updateImageDimensions;
            }
        }
    }, [imageImgRef.current, imageRef.current, selected, updateImageDimensions]);

    useEffect(() => {
        const handleWheelNative = (event: WheelEvent) => {
            if (animatingScale) return;
            
            event.preventDefault();
            
            const target = event.target as Element;
            const isImageElement = target === imageImgRef.current || 
                                 target === imageRef.current || 
                                 (imageRef.current && imageRef.current.contains(target));
            
            if (!isImageElement) return;

            const rect = target.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const normX = (mouseX - rect.width / 2) / (rect.width / 2);
            const normY = (mouseY - rect.height / 2) / (rect.height / 2);

            const oldScale = scale;
            const zoomStep = 0.1;
            let newScale = event.deltaY < 0 ? scale + zoomStep : scale - zoomStep;
            newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
            newScale = autoCorrectScale(newScale);

            if (newScale !== oldScale) {
                setScale(newScale);

                if (newScale > 1) {
                    const scaleChange = newScale / oldScale;
                    const deltaX = normX * rect.width * (scaleChange - 1) / 2;
                    const deltaY = normY * rect.height * (scaleChange - 1) / 2;
                    
                    setPosition(prev => ({ x: prev.x - deltaX, y: prev.y - deltaY }));
                    setIsZoomed(true);

                    setTimeout(() => {
                        updateImageDimensions();
                        clampPosition();
                    }, 0);
                } else {
                    setPosition({ x: 0, y: 0 });
                    setIsZoomed(false);
                }
            }
        };

        const currentImageImg = imageImgRef.current;
        const currentImageDiv = imageRef.current;

        if (currentImageImg) {
            currentImageImg.addEventListener('wheel', handleWheelNative, { passive: false });
        }
        if (currentImageDiv) {
            currentImageDiv.addEventListener('wheel', handleWheelNative, { passive: false });
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            if (currentImageImg) {
                currentImageImg.removeEventListener('wheel', handleWheelNative);
            }
            if (currentImageDiv) {
                currentImageDiv.removeEventListener('wheel', handleWheelNative);
            }
            
            if (tapTimeoutRef.current) {
                clearTimeout(tapTimeoutRef.current);
                tapTimeoutRef.current = null;
            }
            if (inertiaTimeoutRef.current) {
                clearTimeout(inertiaTimeoutRef.current);
                inertiaTimeoutRef.current = null;
            }
        };
    }, [handleMouseMove, handleMouseUp, scale, animatingScale, updateImageDimensions, clampPosition, autoCorrectScale]);

    useEffect(() => {
        setPosition({ x: 0, y: 0 });
        setScale(1);
        startPosition.current = null;
        setIsZoomed(false);
        setAnimatingScale(false);
        setDragging(false);
        setTouchDistance(null);
        velocityRef.current = { x: 0, y: 0 };
        lastTapRef.current = 0;
        
        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
            tapTimeoutRef.current = null;
        }
        if (inertiaTimeoutRef.current) {
            clearTimeout(inertiaTimeoutRef.current);
            inertiaTimeoutRef.current = null;
        }
    }, [selected.file_path, selected.neo_file]);

    return (
        <div
            className="ImageBox"
            ref={containerRef}
            onClick={(e) => e.stopPropagation()}
        >
            {
                selected.file_path ? (
                    <motion.img
                        ref={imageImgRef}
                        src={selected.file_path}
                        style={{
                            cursor: dragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default'),
                            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                            userSelect: 'none',
                            touchAction: 'none',
                            zIndex: 2
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        draggable={false}
                    />
                ) : (
                    <motion.div
                        ref={imageRef}
                        style={{
                            cursor: dragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default'),
                            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                            userSelect: 'none',
                            zIndex: 2,
                            touchAction: 'none'
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                    >
                        <NeoImage
                            image={selected.neo_file}
                            lossless={true}
                            draggable={false}
                        />
                    </motion.div>
                )
            }
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    pointerEvents: isZoomed ? 'none' : 'auto',
                    zIndex: 1
                }}
            />
        </div>
    );
});

const ImageView = () => {
    const dispatch = useDispatch();
    const ivState = useSelector((state: any) => state.imageView) as ImageViewState;

    const handleClose = useCallback(() => {
        dispatch(setOpen(false));
        dispatch(setImage({ file_path: null, metadata: { file_name: '' } }));
        dispatch(setImages([]));
    }, [dispatch]);

    const selectImage = useCallback((image: ImageViewImage) => {
        dispatch(setImage(image));
    }, [dispatch]);

    return (
        <AnimatePresence>
            {ivState.isOpen && (
                <motion.div
                    className="UI-ImageView"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    style={{
                        position: 'fixed',
                        zIndex: 9999,
                        touchAction: 'none'
                    }}
                >
                    <TopBar 
                        selected={ivState.selected} 
                        onClose={handleClose} 
                    />
                    
                    <ImageContent 
                        selected={ivState.selected} 
                        onClose={handleClose} 
                    />
                    
                    {(ivState.images.length > 0) && (
                        <BottomBar
                            images={ivState.images} 
                            selected={ivState.selected} 
                            onSelectImage={selectImage} 
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default memo(ImageView);