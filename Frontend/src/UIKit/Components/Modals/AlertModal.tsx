import { useState } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Backdrop } from './Backdrop';
import TextInput from '../Inputs/TextInput';
import Button from '../Buttons/Button';

const AlertModal = ({
    isOpen,
    onConfirm,
    onClose,
    onCloseModal,
    onAnimationComplete,
    type,
    title = '',
    message = '',
    zIndex = 40
}: any) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState('');

    const animations: Variants = {
        hidden: {
            transform: 'translate(-50%, -50%) scale(1.5)',
            opacity: 0,
            visibility: 'visible',
        },
        show: {
            transform: 'translate(-50%, -50%) scale(1)',
            opacity: 1,
            boxShadow: 'var(--AIR_SHADOW)',
            transition: { duration: 0.2 },
        },
        hide: {
            transform: 'translate(-50%, -50%) scale(1.5)',
            opacity: 0,
            transition: { duration: 0.2 },
        }
    };

    const handleNext = (): void => {
        if (onConfirm) {
            onConfirm(inputValue);
        }
        handleClose();
    };

    const handleClose = () => {
        onCloseModal();

        if (onClose) {
            onClose();
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <Backdrop
                        onClick={handleClose}
                        style={{ zIndex }}
                    />
                    <motion.div
                        className="UI-Window"
                        initial="hidden"
                        animate="show"
                        exit="hide"
                        variants={animations}
                        onAnimationComplete={(definition) => {
                            if (definition === 'exit' && onAnimationComplete) {
                                onAnimationComplete();
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ zIndex }}
                    >
                        <div className="UI-Window_content">
                            <div className="UI-Window_title">{title}</div>
                            <div className="UI-Window_text">{message}</div>
                        </div>
                        {type === 'input' && (
                            <TextInput
                                value={inputValue}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setInputValue(e.target.value)
                                }
                                type="text"
                                placeholder={t('input_text')}
                            />
                        )}
                        <div className="UI-Window_BTNS">
                            {(type === 'query' || type === 'input') ? (
                                <>
                                    <Button
                                        title={t('next')}
                                        onClick={handleNext}
                                        buttonStyle="action"
                                        style={{ width: '100%' }}
                                    />
                                    <Button
                                        title="Отменить"
                                        onClick={handleClose}
                                        className="UI-Window_BTN_NOACT"
                                        style={{ width: '100%' }}
                                    />
                                </>
                            ) : (
                                <Button
                                    title="Хорошо"
                                    onClick={handleNext}
                                    buttonStyle="action"
                                    style={{ width: '100%' }}
                                />
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default AlertModal;
