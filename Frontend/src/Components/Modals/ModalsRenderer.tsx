import { AnimatePresence } from 'framer-motion';
import { useModalsStore } from '../../Store/modalsStore';
import { AlertModal, RoutedModal } from '../../UIKit';

const ModalsRenderer = () => {
    const stack = useModalsStore((state) => state.stack);
    const startClosingModal = useModalsStore((state) => state.startClosingModal);
    const removeModal = useModalsStore((state) => state.removeModal);

    return (
        <AnimatePresence>
            {stack.map((modal, index) => {
                const zIndex = 1000 + index;
                const isOpen = !modal.isClosing;

                switch (modal.type) {
                    case 'routed':
                        return (
                            <RoutedModal
                                key={modal.id}
                                isOpen={isOpen}
                                onCloseModal={() => startClosingModal(modal.id)}
                                onAnimationComplete={() => removeModal(modal.id)}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                    case 'alert':
                    case 'query':
                    case 'input':
                        return (
                            <AlertModal
                                key={modal.id}
                                type={modal.type}
                                isOpen={isOpen}
                                onCloseModal={() => startClosingModal(modal.id)}
                                onAnimationComplete={() => removeModal(modal.id)}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                    default:
                        return null;
                }
            })}
        </AnimatePresence>
    );
};

export default ModalsRenderer;
