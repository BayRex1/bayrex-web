import { useEffect, useRef, useState } from 'react';

const Slider = ({ min = 0, max = 100, value, onChange, step = 1, vertical = false }) => {
    const sliderRef = useRef<any>(null);
    const [progress, setProgress] = useState(((value - min) / (max - min)) * 100 || 0);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!isDragging) {
            const percent = ((value - min) / (max - min)) * 100;
            setProgress(percent || 0);
        }
    }, [value, min, max, isDragging]);

    const calcProgress = (e) => {
        const sliderRect = sliderRef.current.getBoundingClientRect();

        if (vertical) {
            const offsetY = e.clientY - sliderRect.top;
            const percent = 100 - (offsetY / sliderRect.height) * 100;
            return Math.max(0, Math.min(100, percent));
        }

        const offsetX = e.clientX - sliderRect.left;
        return Math.max(0, Math.min(100, (offsetX / sliderRect.width) * 100));
    };

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        setIsDragging(true);
        const newPercent = calcProgress(e);
        setProgress(newPercent);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!sliderRef.current) return;
        const newPercent = calcProgress(e);
        setProgress(newPercent);

        const newValue = Math.round(((newPercent / 100) * (max - min) + min) / step) * step;
        if (onChange) onChange(newValue);
    };

    const handleMouseUp = (e) => {
        if (e.button !== 0) return;
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        const newPercent = calcProgress(e);
        setProgress(newPercent);
        const newValue = Math.round(((newPercent / 100) * (max - min) + min) / step) * step;
        if (onChange) onChange(newValue);
    };

    const sliderStyle = vertical
        ? { width: isDragging ? '10px' : '', borderRadius: isDragging ? '5px' : '' }
        : { height: isDragging ? '10px' : '', borderRadius: isDragging ? '5px' : '' };

    return (
        <div
            className={`UI-Slider ${vertical ? 'Vertical' : ''}`}
            style={sliderStyle}
            ref={sliderRef}
            onMouseDown={handleMouseDown}
        >
            <div
                className={`Progress ${vertical ? 'Vertical' : ''}`}
                style={vertical ? { height: `${progress}%` } : { width: `${progress}%` }}
            />
        </div>
    );
};

export default Slider;
