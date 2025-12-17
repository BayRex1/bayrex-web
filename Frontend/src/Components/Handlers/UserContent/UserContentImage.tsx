import { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useImageView } from '../../../System/Hooks/useImageView';
import LottieAnimation from '../../../UIKit/Components/Base/LotteAnimation';
import NeoImage from '../../../UIKit/Components/Base/NeoImage';
import classNames from 'classnames';
import { Ring } from 'ldrs/react';

interface Dot {
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    size: number;
}

const AnimatedImageSpoiler = ({ onReveal }: { onReveal: (e: React.MouseEvent) => void }) => {
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

            const dotsCount = Math.max(20, Math.floor((width * height) / 50));

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
                1 фото
            </div>
        </div>
    );
};

const UserContentImage = ({ image, censoring }) => {
    const [error, setError] = useState(false);
    const [isCensoring, setCensoring] = useState(censoring);
    const { openImage } = useImageView();

    const { ref: loadedRef, inView: isLoaded } = useInView({
        threshold: 0,
        triggerOnce: true
    });

    const handleOpen = () => {
        openImage({
            neo_file: image.img_data,
            metadata: {
                file_name: image.file_name,
                file_size: image.file_size
            }
        })
    }

    const revealContent = (e) => {
        e.stopPropagation();
        setCensoring(false);
    }

    return (
        <div
            className="UserContent-Image"
            ref={loadedRef}
        >
            {isLoaded ? (
                !error ? (
                    <>
                        <NeoImage
                            className="IMG"
                            onError={() => setError(true)}
                            image={image.img_data}
                            draggable={false}
                            onClick={handleOpen}
                        />
                        {isCensoring && (
                            <AnimatedImageSpoiler onReveal={revealContent} />
                        )}
                        <div className={classNames('Blur', { 'NoBlur': isCensoring })}></div>
                        {
                            image.img_data?.preview && (
                                <img
                                    className="BlurIMG"
                                    src={image.img_data.preview}
                                    draggable={false}
                                    alt="фыр"
                                />
                            )
                        }
                    </>
                ) : (
                    <div className="Error">
                        <LottieAnimation className="Emoji" url="/static_sys/Lottie/Spider.json" />
                        <div className="Text">Ошибка загрузки файла</div>
                    </div>
                )
            ) : (
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
}

export default UserContentImage;