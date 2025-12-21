import { cloneElement, isValidElement, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import NavigatedHeader from '../Layout/NavigatedHeader';
import { Backdrop } from './Backdrop';

interface ModalChildProps {
    onClose: () => void;
}

interface RoutedModalProps {
    isOpen: boolean;
    onCloseModal: () => void;
    onAnimationComplete?: () => void;
    children?: React.ReactElement<ModalChildProps>;
    title?: string;
    zIndex?: number;
    onClose?: any;
}

const modalVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
        y: '0%',
        opacity: 1,
        transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
    },
    exit: {
        y: '100%',
        opacity: 0,
        transition: { duration: 0.2 },
    },
};

const RoutedModal = ({
    isOpen,
    onCloseModal,
    onAnimationComplete,
    children,
    title = '',
    zIndex = 40,
    onClose
}: RoutedModalProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleClose = () => {
        onCloseModal();

        if (onClose) {
            onClose();
        }
    }

    const renderContent = () => {
        return isValidElement(children) ? cloneElement(children, { onClose: handleClose }) : children;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <Backdrop onClick={handleClose} style={{ zIndex }} />
                    <motion.div
                        className="UI-Modal"
                        role="dialog"
                        aria-modal="true"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ zIndex: zIndex + 1 }}
                        onAnimationComplete={(definition) => {
                            if (definition === 'exit' && onAnimationComplete) {
                                onAnimationComplete();
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <NavigatedHeader
                            title={title}
                            onBack={handleClose}
                            scrollRef={scrollRef}
                        />
                        <div ref={scrollRef} className="UI-ModalContent">
                            <div className="Scroll">
                                {renderContent()}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default RoutedModal;
