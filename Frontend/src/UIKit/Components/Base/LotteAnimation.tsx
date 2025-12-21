import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import type { LottieOptions } from 'lottie-react';

interface LottieAnimationProps {
    className?: string;
    lottie?: object;
    url?: string;
    loop?: boolean;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({ className, lottie, url, loop }) => {
    const [animationData, setAnimationData] = useState<object | null>(null);

    useEffect(() => {
        if (url) {
            fetch(url)
                .then((response) => response.json())
                .then((data) => setAnimationData(data))
                .catch((error) => console.error('Ошибка загрузки анимации:', error));
        } else if (lottie) {
            setAnimationData(lottie);
        }
    }, [url, lottie]);

    const options: LottieOptions = {
        animationData: animationData as object,
        loop: loop !== undefined ? loop : true,
        autoplay: true,
    };

    return (
        <div className={className}>
            {animationData && <Lottie {...options} />}
        </div>
    );
};

export default LottieAnimation;
