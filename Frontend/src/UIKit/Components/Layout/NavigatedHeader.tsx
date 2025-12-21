import { useEffect, useRef, useState } from 'react';
import { I_DOTS } from '../../../System/UI/IconPack';
import BackButton from '../Buttons/BackButton';
import GovernButtons from '../Buttons/GovernButtons';

interface NavigatedHeaderProps {
    title?: string;
    onBack: () => void;
    buttons?: any[];
    scrollRef?: React.RefObject<HTMLElement | null>;
    isOverlay?: boolean;
    paddingLeft?: number;
}

const NavigatedHeader: React.FC<NavigatedHeaderProps> = ({
    title,
    onBack,
    buttons = [],
    scrollRef,
    isOverlay = true,
    paddingLeft = 10
}) => {
    const bgRef = useRef<HTMLDivElement>(null);
    const [buttonsIsOpen, setButtonsIsOpen] = useState(false);

    useEffect(() => {
        if (scrollRef) {
            const scrollEl = scrollRef.current;
            const bgEl = bgRef.current;
            if (!scrollEl || !bgEl) return;

            const maxScroll = 100;

            const handleScroll = () => {
                const scrollTop = scrollEl.scrollTop;
                const opacity = Math.min(scrollTop / maxScroll, 1);
                bgEl.style.opacity = String(opacity);

                if (opacity > 0.5) {
                    bgEl.style.borderBottom = '1px solid var(--AIR_BLOCK_COLOR)';
                }
            };

            scrollEl.addEventListener('scroll', handleScroll);
            handleScroll();

            return () => {
                scrollEl.removeEventListener('scroll', handleScroll);
            };
        }
    }, [scrollRef]);

    return (
        <div
            className='UI-NavigatedHeader'
            style={{
                position: isOverlay ? 'absolute' : 'relative'
            }}
        >
            <div className='BG' ref={bgRef} style={{ opacity: 0 }}></div>
            <div className='Body'>
                <BackButton
                    onClick={onBack}
                    style={{
                        marginLeft: `${paddingLeft}px`
                    }}
                />
                {title && <div className='Title'>{title}</div>}
                {buttons.length > 0 && (
                    <button
                        onClick={() => {
                            setButtonsIsOpen(!buttonsIsOpen);
                        }}
                        className='Dots'
                    >
                        <I_DOTS />
                    </button>
                )}
                <GovernButtons buttons={buttons} isOpen={buttonsIsOpen} />
            </div>
        </div>
    );
};

export default NavigatedHeader;
