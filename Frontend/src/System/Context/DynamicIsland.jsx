import { createContext, useState, useEffect, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const DynamicIslandContext = createContext();
const generateRandomIndex = () => Math.floor(Math.random() * 10000);

export const DynamicIslandProvider = ({ children }) => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (message) {
            const timeout = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timeout);
        }
    }, [message]);

    const diCreateMessage = (newMessage, timeout = 3000) => {
        setMessage(newMessage);
        if (timeout > 0) {
            setTimeout(() => setMessage(''), timeout);
        }
    };

    return (
        <DynamicIslandContext.Provider value={{ message, diCreateMessage }}>
            {children}
        </DynamicIslandContext.Provider>
    );
};

export const useDynamicIsland = () => {
    const context = useContext(DynamicIslandContext);
    if (!context) {
        throw new Error('useDynamicIsland must be used within a DynamicIslandProvider');
    }
    return context;
};

export const DynamicIsland = () => {
    const { message } = useContext(DynamicIslandContext);

    const variants = {
        initial: {
            borderRadius: '0px 0px 100px 100px',
            filter: 'blur(5px)',
            y: -100,
            transition: { duration: 0.2 }
        },
        animate: {
            borderRadius: '100px 100px 100px 100px',
            filter: 'blur(0px)',
            y: 0,
            transition: {
                y: { duration: 0.3 },
                borderRadius: { duration: 0.3, delay: 0.20 },
                filter: { duration: 0.3, delay: 0.15, ease: 'linear' }
            }
        },
        exit: {
            borderRadius: '0px 0px 100px 100px',
            filter: 'blur(10px)',
            y: -100,
            transition: {
                y: { duration: 0.3 },
                borderRadius: { duration: 0.3 },
                filter: { duration: 0.3, delay: 0.15, ease: 'linear' }
            }
        }
    };

    const randomIndex = generateRandomIndex();

    const HandleMessage = ({ message }) => {
        return (
            <>
                <div className="Animation">
                    {message.animation}
                </div>
                {
                    message?.text ? (
                        <div className="Message">
                            {message.text}
                        </div>
                    ) : (
                        <div className="DIContent">
                            {message.content}
                        </div>
                    )
                }
            </>
        )
    }

    return (
        <AnimatePresence mode="sync">
            {
                message && (
                    <motion.div
                        className="UI-DynamicIsland"
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <motion.div
                            key={randomIndex}
                            className="DynamicContent"
                            initial={{ blur: 10 }}
                            animate={{ blur: 0 }}
                            exit={{ blur: 10 }}
                        >
                            <HandleMessage message={message} />
                        </motion.div>
                    </motion.div>
                )
            }
        </AnimatePresence>
    );
};
