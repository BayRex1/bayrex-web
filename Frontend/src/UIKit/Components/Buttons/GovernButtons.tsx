import { useClickAway } from '@uidotdev/usehooks';
import { AnimatePresence, motion } from 'framer-motion';

interface GovernButtonProps {
    isOpen: boolean;
    setIsOpen?: any;
    buttons: any[]
}

const GovernButtons = ({ isOpen, setIsOpen, buttons }: GovernButtonProps) => {
    const ref: any = useClickAway(() => {
        if (setIsOpen) {
            setIsOpen(false);
        }
    });

    const variants = {
        show: {
            opacity: 1,
            boxShadow: '0px 1px 10px 1px var(--AIR_CONTEXT_SHADOW_COLOR_END)',
            transition: { duration: 0.2 }
        },
        hide: {
            opacity: 0,
            boxShadow: '0px 0px 0px 0px var(--AIR_CONTEXT_SHADOW_COLOR_START)',
            transition: { duration: 0.2 }
        },
    }

    return (
        <AnimatePresence>
            {
                isOpen && (
                    <motion.div
                        className="UI-GovernButtons"
                        variants={variants}
                        initial="hide"
                        animate="show"
                        exit="hide"
                        ref={ref}
                    >
                        <div className="Container">
                            {buttons.map((button, i) => (
                                <button key={i} onClick={button.onClick}>
                                    {button.icon}
                                    {button.title}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )
            }
        </AnimatePresence>
    );
}

export default GovernButtons;