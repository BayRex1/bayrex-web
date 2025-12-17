import { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useImageView } from '../../../System/Hooks/useImageView';
import NeoImage from '../../../UIKit/Components/Base/NeoImage';
import { Ring } from 'ldrs/react';

interface Dot {
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    size: number;
}

const AnimatedImageSpoiler = ({ onReveal, imagesCount }: { onReveal: (e: React.MouseEvent) => void, imagesCount: number }) => {
    const spoilerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const dotsRef = useRef<Dot[]>([]);

    useEffect(() => {
        const spoilerEl = spoilerRef.current;
        if (!spoilerEl) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.borderRadius = 'inherit';

        spoilerEl.appendChild(canvas);

        const updateCanvas = () => {
            const rect = spoilerEl.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';

            if (rect.width > 0 && rect.height > 0) {
                initDots();
            }
        };

        const initDots = () => {
            dotsRef.current = [];
            const width = spoilerEl.offsetWidth;
            const height = spoilerEl.offsetHeight;

            if (width <= 0 || height <= 0) return;

            const dotsCount = Math.max(20, Math.floor((width * height) / 80));

            for (let i = 0; i < dotsCount; i++) {
                dotsRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    opacity: 0.4 + Math.random() * 0.3,
                    size: 0.5 + Math.random() * 0.8
                });
            }
        };

        const animate = () => {
            const width = spoilerEl.offsetWidth;
            const height = spoilerEl.offsetHeight;

            if (!ctx || !width || !height) return;

            ctx.clearRect(0, 0, width, height);

            dotsRef.current.forEach(dot => {
                dot.x += dot.vx;
                dot.y += dot.vy;

                if (dot.x < 0 || dot.x > width) dot.vx *= -1;
                if (dot.y < 0 || dot.y > height) dot.vy *= -1;

                dot.x = Math.max(0, Math.min(width, dot.x));
                dot.y = Math.max(0, Math.min(height, dot.y));

                dot.opacity += (Math.random() - 0.5) * 0.02;
                dot.opacity = Math.max(0.2, Math.min(0.8, dot.opacity));

                ctx.fillStyle = `rgba(128, 128, 128, ${dot.opacity})`;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
                ctx.fill();
            });

            setTimeout(() => {
                animationRef.current = requestAnimationFrame(animate);
            }, 50);
        };

        setTimeout(() => {
            updateCanvas();
            animate();
        }, 100);

        const resizeObserver = new ResizeObserver(updateCanvas);
        resizeObserver.observe(spoilerEl);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            resizeObserver.disconnect();
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        };
    }, []);

    return (
        <div
            ref={spoilerRef}
            onClick={(e) => {
                e.stopPropagation();
                e.currentTarget.classList.add('spoiler-message__showed');
                setTimeout(() => onReveal(e), 300);
            }}
            className="spoiler-message spoiler-message-animated image-spoiler-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(180, 180, 180, 0.4)',
                backdropFilter: 'blur(15px)',
                borderRadius: 'var(--BR_BASE)',
                cursor: 'pointer',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.3s ease, transform 0.3s ease'
            }}
        >
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#FFF',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '0.8em',
                fontWeight: 'bold',
                userSelect: 'none',
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.4)',
                zIndex: 10
            }}>
                {imagesCount} {imagesCount === 1 ? 'фото' : imagesCount < 5 ? 'фото' : 'фото'}
            </div>
        </div>
    );
};

const UserContentImages = ({ images, censoring }) => {
    const { openImage, openImages } = useImageView();
    const [isCensoring, setCensoring] = useState(censoring);

    const { ref: loadedRef, inView: isLoaded } = useInView({
        threshold: 0,
        triggerOnce: true
    });

    const revealContent = (e) => {
        e.stopPropagation();
        setCensoring(false);
    };

    let S_I = 0;
    let L_I = images.length - 2;

    const handleOpen = (index) => {
        const imageIndex = typeof index === 'number' && index >= 0 && index < images.length ? index : 0;

        if (!images || !images[imageIndex] || !images[imageIndex].img_data) {
            return;
        }

        openImage({
            neo_file: images[imageIndex].img_data,
            metadata: {
                file_name: images[imageIndex].file_name,
                file_size: images[imageIndex].file_size
            }
        })

        const validImages = images.filter(image => image && image.img_data);
        openImages(validImages.map((image) => (
            {
                neo_file: image.img_data,
                metadata: {
                    file_name: image.file_name,
                    file_size: image.file_size
                }
            }
        )))
    }

    return (
        <div className="UserContent-Images" ref={loadedRef} >
            {isLoaded ?
                (<>
                    {isCensoring && (
                        <AnimatedImageSpoiler onReveal={revealContent} imagesCount={images.length} />
                    )}
                    {images.map((image, i) => {
                        if (i + 1 >= 4) {
                            return false;
                        }
                        if (!image || !image.img_data) {
                            return null;
                        }

                        S_I++;
                        const clickHandler = (e) => {
                            e.stopPropagation();
                            handleOpen(i);
                        };

                        return (
                            <div key={i} onClick={clickHandler} className={`P${S_I}${S_I > 2 && L_I > 2 ? ' Blured' : ''}`}>
                                <NeoImage
                                    className="IMG"
                                    image={image.img_data}
                                    draggable={false}
                                />
                                {
                                    S_I > 2 && L_I > 2 && (
                                        <div
                                            className="Count"
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                color: 'rgba(255, 255, 255, 0.95)',
                                                fontSize: '3em',
                                                fontWeight: 'bold',
                                                zIndex: 10,
                                                textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)',
                                                userSelect: 'none',
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            +{L_I}
                                        </div>
                                    )
                                }
                            </div>
                        )
                    })}
                </>) : (
                    <div className="UI-Loading">
                        <Ring
                            size="30"
                            stroke="3"
                            bgOpacity="0"
                            speed="2"
                            color="var(--TEXT_COLOR)"
                        />
                    </div>
                )
            }
        </div>
    )
};

export default UserContentImages;