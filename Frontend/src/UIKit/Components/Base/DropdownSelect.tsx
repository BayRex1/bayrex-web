import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { I_DROPDOWN } from '../../../System/UI/IconPack';
import { useClickAway } from '@uidotdev/usehooks';

const DropdownSelect = ({ list, setSelected }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSelect, setActiveSelect] = useState(0);
    const ref = useClickAway(() => {
        setIsOpen(false);
    });

    const variants = {
        hidden: {
            opacity: 0,
            scale: 0.5,
            y: '-30%',
            boxShadow: '0px 0px 0px 0px var(--AIR_CONTEXT_SHADOW_COLOR_START)',
            transition: { duration: 0.15 },
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: '0%',
            boxShadow: '0px 1px 10px 1px var(--AIR_CONTEXT_SHADOW_COLOR_END)',
            transition: { duration: 0.15 },
        },
    };

    const handleSelect = (i) => {
        setSelected(i);
        setActiveSelect(i);
    };

    return (
        <>
            <button
                className="UI-DropdownSelect"
                onClick={() => setIsOpen(!isOpen)}
            >
                {list?.[activeSelect]?.title} <I_DROPDOWN />
            </button>
            <div style={{ position: 'relative' }}>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            className="UI-DS_List"
                            variants={variants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            ref={ref}
                        >
                            {list.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(i)}
                                    className={i === activeSelect ? 'Selected' : ''}
                                >
                                    {item.title}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default DropdownSelect;
