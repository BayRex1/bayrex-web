import { useEffect, useState } from 'react';
import Emojis from '../../../Configs/Emoji.json';
import { I_EP_ACTIONS, I_EP_BULB, I_EP_CAR, I_EP_FOX, I_EP_FLAG, I_EP_FOOD, I_EP_SMILE, I_EP_SYMBOL } from '../../../System/UI/IconPack';
import { AnimatePresence, motion } from 'framer-motion';
import { useClickAway } from '@uidotdev/usehooks';
import classNames from 'classnames';
import { isMobile } from 'react-device-detect';

interface EmojiPickerProps {
    isOpen: boolean;
    setIsOpen: any;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
    inputRef: any;
    onEmojiSelect: (emoji: string) => void;
    className?: string;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, setIsOpen, buttonRef, inputRef, onEmojiSelect, className }) => {
    const [currentCategory, setCurrentCategory] = useState<string>('smileys_and_people');
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const ref = useClickAway<HTMLDivElement>(() => {
        setIsOpen(false);
    });

    const getScrollParent = (element: HTMLElement | null): HTMLElement | Window => {
        if (!element) return window;
        const style = getComputedStyle(element);
        const overflowRegex = /(auto|scroll)/;
        if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) {
            return element;
        }
        return getScrollParent(element.parentElement);
    };

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const pickerWidth = 300;
            const scrollParent = getScrollParent(buttonRef.current);
            const scrollTop = scrollParent instanceof Window ? window.scrollY : scrollParent.scrollTop;
            const scrollLeft = scrollParent instanceof Window ? window.scrollX : scrollParent.scrollLeft;

            setPosition({
                top: rect.bottom + scrollTop + 10, // смещение ниже кнопки
                left: rect.left + scrollLeft + (rect.width / 2) - (pickerWidth / 2)
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
        }
    }, [isOpen, buttonRef]);

    useEffect(() => {
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, []);

    const handleCategoryChange = (category: string) => {
        setCurrentCategory(category);
    };

    const handleEmojiSelect = (emoji: string) => {
        onEmojiSelect(emoji);
        
        const input = inputRef.current;
        if (input) {
            setTimeout(() => {
                input.focus();
                if (typeof input.selectionStart === 'number') {
                    const length = input.value.length;
                    input.setSelectionRange(length, length);
                }
            }, 0);
        }
    };

    const currentEmojis = Emojis.find(category => category[currentCategory])?.[currentCategory] || [];

    const categories = [
        {
            code: 'smileys_and_people',
            icon: <I_EP_SMILE />
        },
        {
            code: 'animals_and_nature',
            icon: <I_EP_FOX />
        },
        {
            code: 'food_and_drink',
            icon: <I_EP_FOOD />
        },
        {
            code: 'actions',
            icon: <I_EP_ACTIONS />
        },
        {
            code: 'world',
            icon: <I_EP_CAR />
        },
        {
            code: 'objects',
            icon: <I_EP_BULB />
        },
        {
            code: 'symbols',
            icon: <I_EP_SYMBOL />
        },
        {
            code: 'flags',
            icon: <I_EP_FLAG />
        },
    ];

    return (
        <>
            {
                isOpen && (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        position: 'fixed',
                        zIndex: 1
                    }}></div>
                )
            }
            <AnimatePresence>
                {
                    isOpen && (
                        <motion.div
                            className={classNames("UI-EmojiPicker", className)}
                            ref={ref}
                            style={{
                                top: position.top,
                                left: isMobile ? 0 : position.left,
                                right: isMobile ? 0 : '',
                                width: className === 'sidebar-emoji-picker' ? '100%' : undefined
                            }}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                        >
                            <div className="Categories">
                                {
                                    categories.map((category, i) => (
                                        <button
                                            key={i}
                                            className={classNames('Category', {
                                                'Selected': category.code === currentCategory
                                            })}
                                            onClick={() => handleCategoryChange(category.code)}
                                        >
                                            {category.icon}
                                        </button>
                                    ))
                                }
                            </div>
                            <div className="Grid">
                                <div className="Grid">
                                    {currentEmojis && (
                                        currentEmojis.map((emojiObj, index) => (
                                            <div
                                                key={index}
                                                className="EmojiItem"
                                                title={emojiObj.emoji}
                                                onClick={() => handleEmojiSelect(emojiObj.emoji)}
                                            >
                                                <div className="UI-Emoji">
                                                    <img
                                                        src={`/static_sys/Images/Emoji/Apple/${emojiObj.unified.toLowerCase()}.png`}
                                                        alt={emojiObj.emoji}
                                                        draggable="false"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </>
    );
};

export default EmojiPicker;
