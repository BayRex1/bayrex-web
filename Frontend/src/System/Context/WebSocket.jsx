import { createContext, useEffect, useContext, useCallback, useRef, useState } from 'react';
import { websocketClient } from '../../Services/WebSocketClient';
import { useDynamicIsland } from './DynamicIsland';
import LottieAnimation from '../../UIKit/Components/Base/LotteAnimation';
import SuccessAnimation from '../../Animations/Success.json';
import ErrorAnimation from '../../Animations/Error.json';
import ClockAnimation from '../../Animations/Clock.json';
import { useAuth } from '../Hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const navigate = useNavigate();
    const { accountData, deleteAccount, updateAccount, setSocketAuthorized } = useAuth();
    const { diCreateMessage } = useDynamicIsland();
    const [socketReady, setSocketReady] = useState(false);

    useEffect(() => {
        const pingInterval = setInterval(() => {
            websocketClient.send({ type: 'ping' });
        }, 5000);

        return () => clearInterval(pingInterval);
    }, []);

    const connect = () => {
        diCreateMessage({
            animation: (
                <LottieAnimation lottie={SuccessAnimation} loop={false} />
            ),
            text: 'Подключено'
        },
            3000
        );
    }

    const disconnect = () => {
        setSocketReady(false);
        diCreateMessage({
            animation: (
                <LottieAnimation lottie={ErrorAnimation} loop={false} />
            ),
            text: 'Отключение'
        },
            3000
        );
    }

    const update = () => {
        if (accountData) {
            diCreateMessage({
                animation: (
                    <LottieAnimation lottie={ClockAnimation} loop={false} />
                ),
                text: 'Обновление'
            },
                3000
            );
            websocketClient.send({
                type: 'authorization',
                action: 'connect',
                S_KEY: accountData.S_KEY
            }).then((res) => {
                if (res.status === 'success') {
                    updateAccount(res.accountData);
                    setSocketAuthorized(true);
                } else if (res.status === 'error') {
                    deleteAccount(accountData.id);
                    navigate('/auth');
                }
            })
        }
    }

    useEffect(() => {
        websocketClient.on('socket_connect', () => {
            connect();
        });
        websocketClient.on('socket_disconnect', () => {
            disconnect();
        });
        websocketClient.on('socket_ready', () => {
            setSocketReady(true);
            update();
        });

        websocketClient.onMessage('permissions_updated', (data) => {
            if (data.type === 'permissions_updated' && data.payload) {
                updateAccount({
                    ...accountData,
                    permissions: data.payload
                });
                
                diCreateMessage({
                    animation: (
                        <LottieAnimation lottie={ClockAnimation} loop={false} />
                    ),
                    text: 'Ограничения обновлены'
                }, 5000);
            }
        });

        websocketClient.connect();

        return () => {
            websocketClient.off('socket_connect', () => {
                disconnect();
            });
            websocketClient.off('socket_disconnect', () => {
                disconnect();
            });
            websocketClient.off('socket_ready', () => {
                disconnect();
            });
            websocketClient.disconnect();
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ socketReady, wsClient: websocketClient }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};

export const useWebSocketEvent = (type, callback) => {
    const { wsClient } = useWebSocket();
    const messageQueue = useRef([]);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const handleMessage = (data) => {
        messageQueue.current.push(data);
        processMessageQueue();
    };

    useEffect(() => {
        if (!wsClient) return;

        wsClient.onMessage(type, handleMessage);

        return () => {
            wsClient.offMessage(type, handleMessage);
        };
    }, [wsClient, type]);

    const processMessageQueue = () => {
        if (messageQueue.current.length > 0) {
            const messagesToProcess = messageQueue.current.splice(0, 50);

            messagesToProcess.forEach(message => {
                callbackRef.current(message);
            });

            if (messageQueue.current.length > 0) {
                setImmediate(processMessageQueue);
            }
        }
    };
};

export const useMessengerEvent = (action, callback) => {
    const callbackRef = useCallback((data) => {
        if (data.type === 'messenger' && data.action === action) {
            callback(data);
        }
    }, [action, callback]);

    useWebSocketEvent('messenger', callbackRef);
};

export const useSocialEvent = (action, callback) => {
    const callbackRef = useCallback((data) => {
        if (data.type === 'social' && data.action === action) {
            callback(data);
        }
    }, [action, callback]);

    useWebSocketEvent('social', callbackRef);
};