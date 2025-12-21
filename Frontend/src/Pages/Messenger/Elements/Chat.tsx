import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { aesDecryptFile, aesDecryptUnit8 } from '../../../System/Modules/Crypto';
import { useMessengerEvent, useWebSocket } from '../../../System/Context/WebSocket';
import ChatView from './Components/ChatView';
import BottomBar from './Components/BottomBar';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, setMessages, setMessagesLoaded, updateChat, updateDownloadProgress } from '../../../Store/Slices/messenger';
import TopBar from './Components/TopBar';
import { useDatabase } from '../../../System/Context/Database';
import ChatMenu from './Components/ChatMenu';
import { isMobile } from 'react-device-detect';
import { EmojiPicker } from '../../../UIKit';
import { I_ADD_FILE } from '../../../System/UI/IconPack';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import classNames from 'classnames';

const Chat = ({ chatDataLoaded, keyword }: any) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const db = useDatabase();
    const selectedChat = useSelector((state: any) => state.messenger.selectedChat);
    const emojiSidebarOpen = useSelector((state: any) => state.messenger.emojiSidebarOpen);
    const dispatch = useDispatch();
    const messages = useSelector((state: any) =>
        selectedChat
            ? state.messenger.chats[selectedChat.type]?.[selectedChat.id]?.messages || []
            : []
    );
    const messagesLoaded = useSelector((state: any) =>
        selectedChat
            ? state.messenger.chats[selectedChat.type]?.[selectedChat.id]?.messagesLoaded || false
            : false
    );
    const [messagesSI, setMessagesSI] = useState(25);
    const [showLoadMore, setShowLoadMore] = useState(false);
    const [chatMenuOpen, setChatMenuOpen] = useState(false);
    const [actionPanelOpen, setActionPanelOpen] = useState(false);
    
    // Добавляем необходимые рефы
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);
    
    const chatWallpaper = () => {
        const theme: any = localStorage.getItem('S-Theme');

        const wallpapers = {
            GOLD: '/static_sys/Images/Chat/BG_GOLD.svg',
            DARK: '/static_sys/Images/Chat/BG_DARK.svg',
            'DARK-LG': '/static_sys/Images/Chat/BG_DARK.svg',
            AMOLED: '/static_sys/Images/Chat/BG_DARK.svg',
            'AMOLED-LG': '/static_sys/Images/Chat/BG_DARK.svg',
            'GOLD-DARK': '/static_sys/Images/Chat/BG_DARK_GOLD.svg',
            'AMOLED-GOLD': '/static_sys/Images/Chat/BG_DARK_GOLD.svg',
        };
    
        return wallpapers[theme] || '/static_sys/Images/Chat/BG.svg';
    }

    const { ref: loadMoreRef, inView: inView } = useInView({
        threshold: 0
    });

    useEffect(() => {
        if (selectedChat) {
            dispatch(setMessagesLoaded({
                chat_id: selectedChat.id,
                chat_type: selectedChat.type,
                value: false
            }));
        }
    }, [selectedChat])

    useEffect(() => {
        if (inView) {
            loadMoreMessages();
        }
    }, [inView]);

    useEffect(() => {
        if (!messagesLoaded && selectedChat) {
            wsClient.send({
                type: 'messenger',
                action: 'load_messages',
                target: {
                    id: selectedChat.id,
                    type: selectedChat.type
                },
            }).then((res) => {
                handleMessages(res);
            })
        }
    }, [messagesLoaded, selectedChat])

    useEffect(() => {
        if (messagesLoaded) {
            const timer = setTimeout(() => {
                setShowLoadMore(true);
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            setShowLoadMore(false);
        }
    }, [messagesLoaded]);

    // Создание временного ID
    const createTempMesID = (length) => {
        while (true) {
            let id = '';
            for (let i = 0; i < length; i++) {
                id += Math.floor(Math.random() * 10);
            }
            const answer = messages.find(m => m?.temp_mid === id);
            if (!answer) {
                return Number(id);
            }
        }
    }

    const stopSendingFile = (tempMid) => {
        const message = messages.find(m => m.temp_mid === tempMid);
        message.stop();

        wsClient.send({
            type: 'messenger',
            action: 'stop_upload',
            temp_mid: tempMid,
        });
    }

    const handleNewMessage = (data) => {
        if (selectedChat && selectedChat.id === data.target.id) {
            const newMessage = {
                mid: data.mid,
                uid: data.uid,
                author: data.author,
                decrypted: JSON.parse(data.message),
                is_decrypted: true,
                date: data.date
            }
            dispatch(addMessage({
                chat_id: selectedChat.id,
                chat_type: selectedChat.type,
                message: newMessage
            }))
            dispatch(updateChat({
                chat_id: selectedChat.id,
                chat_type: selectedChat.type,
                newData: {
                    last_message: newMessage.decrypted?.text,
                    last_message_date: new Date().toISOString()
                }
            }))
        }
    }

    const handleMessages = async (data) => {
        if (!Array.isArray(data.messages) || !data.messages.length) {
            dispatch(setMessagesLoaded({
                chat_id: selectedChat.id,
                chat_type: selectedChat.type,
                value: true
            }));
            return;
        }

        const isJsonString = (str: string): boolean => {
            try {
                const parsed = JSON.parse(str);
                return typeof parsed === 'object' && parsed !== null;
            } catch (e) {
                return false;
            }
        }

        const decryptedMessages = await Promise.all(
            data.messages.map(async (message) => {
                try {
                    const decrypted = message.encrypted
                        ? await aesDecryptUnit8(new Uint8Array(Object.values(message.encrypted)), keyword)
                        : message.decrypted;

                    const { encrypted, ...rest } = message;

                    return {
                        ...rest,
                        decrypted: isJsonString(decrypted) ? JSON.parse(decrypted) : decrypted
                    };
                } catch (error) {
                    console.error('Ошибка при дешифровке сообщения:', error);
                    const { encrypted, ...rest } = message;
                    return {
                        ...rest,
                        decrypted: message.decrypted || null,
                    };
                }
            })
        );

        console.log('Декодированные сообщения:', decryptedMessages);

        dispatch(
            setMessages({
                chat_id: selectedChat.id,
                chat_type: selectedChat.type,
                messages: decryptedMessages
            })
        );
        dispatch(setMessagesLoaded({
            chat_id: selectedChat.id,
            chat_type: selectedChat.type,
            value: true
        }));
    };

    const loadMoreMessages = () => {
        if (selectedChat) {
            wsClient.send({
                type: 'messenger',
                action: 'load_messages',
                target: {
                    id: selectedChat.id,
                    type: selectedChat.type
                },
                startIndex: messagesSI
            }).then((res) => {
                handleMessages(res);
            });
            setMessagesSI(prev => prev + 25);
        }
    }

    const handleDownloadFile = async (data) => {

        console.log('Пришёл кусок файла', data);

        db.transaction('rw', db.downloads, db.files, async () => {
            let downloading = await db.downloads.where('mid').equals(data.mid).first();
            if (downloading) {
                if (!downloading.file.downloaded.find(chunk => chunk.id === data.file_id)) {
                    downloading.file.downloaded.push({ id: data.file_id, binary: data.binary.buffer });
                }
                await db.downloads.put(downloading);
                const progress = Math.round((downloading.file.downloaded.length / downloading.file.file_map.length) * 99);

                dispatch(updateDownloadProgress({
                    mid: data.mid,
                    chat_id: selectedChat.id,
                    chat_type: selectedChat.type,
                    progress
                }));
            } else {
                const message = messages.find(item => item.mid === data.mid);
                const decrypted = message.decrypted;
                downloading = {
                    mid: data.mid,
                    file: {
                        name: decrypted.file.name,
                        file_map: decrypted.file.file_map,
                        downloaded: [{ id: data.file_id, binary: data.binary.buffer }],
                        encrypted_key: decrypted.file.encrypted_key,
                        encrypted_iv: decrypted.file.encrypted_iv,
                    },
                };
                await db.downloads.put(downloading);
            }

            downloading = await db.downloads.where('mid').equals(data.mid).first();

            if (downloading !== undefined) {
                if (downloading.file.downloaded.length === downloading.file.file_map.length) {
                    const fileExists = await db.files.where('mid').equals(data.mid).first();

                    if (!fileExists) {
                        console.log('Готовлю файл...');

                        const completeFile = downloading.file.file_map.map(id => {
                            const chunk = downloading.file.downloaded.find(chunk => chunk.id === id);
                            if (!chunk) {
                                return new Uint8Array();
                            }
                            return new Uint8Array(chunk.binary);
                        })
                            .reduce((acc, chunk) => new Uint8Array([...acc, ...chunk]), new Uint8Array());

                        const decryptedFile = await aesDecryptFile(completeFile, downloading.file.encrypted_key, downloading.file.encrypted_iv);
                        const file = new Blob([decryptedFile], { type: 'application/octet-stream' });

                        await db.files.put({
                            mid: data.mid,
                            name: downloading.file.name,
                            blob: file
                        });

                        dispatch(updateDownloadProgress({
                            mid: data.mid,
                            chat_id: selectedChat.id,
                            chat_type: selectedChat.type,
                            progress: 100
                        }));
                        console.log('Файл загружен');
                    }
                }
            }
        });
    };

    useMessengerEvent('new_message', handleNewMessage);
    useMessengerEvent('download_file', handleDownloadFile);

    const openChatMenu = () => {
        setChatMenuOpen(true);
    }

    const closeChatMenu = () => {
        setChatMenuOpen(false);
    }

    const messagesScrollRef = useRef(null);
    
    useEffect(() => {
        if (messagesScrollRef.current && messages.length > 0) {
            const container = messagesScrollRef.current;
            const isScrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            
            if (isScrolledToBottom) {
                setTimeout(() => {
                    container.scrollTop = 0;
                }, 100);
            }
        }
    }, [messages.length]);

    return (
        <div className="Chat-Container">
            <div className="Chat-Content">
                <div className={classNames('Chat', { 'with-sidebar': emojiSidebarOpen })}>
                    <div className="Chat-Wallpaper">
                        <img src={chatWallpaper()} alt="фыр" draggable={false} />
                    </div>
                    {chatDataLoaded && chatMenuOpen && (
                        <ChatMenu 
                            closeChatMenu={closeChatMenu}
                        />
                    )}
                    <TopBar 
                        chatDataLoaded={chatDataLoaded} 
                        chatData={selectedChat}
                        openChatMenu={openChatMenu}
                    />
                    <ChatView
                        loadMoreRef={loadMoreRef}
                        stopSendingFile={stopSendingFile}
                        showLoadMore={showLoadMore}
                        messages={messages}
                        messagesLoaded={messagesLoaded}
                        messagesScrollRef={messagesScrollRef}
                    />
                    <BottomBar 
                        createTempMesID={createTempMesID} 
                        selectedChat={selectedChat} 
                        messageInputRef={messageInputRef}
                        actionPanelOpen={actionPanelOpen}
                        setActionPanelOpen={setActionPanelOpen}
                    />
                    
                    <AnimatePresence>
                        {actionPanelOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 200, x: -200, backdropFilter: 'blur(0px)' }}
                                animate={{ opacity: 1, y: 0, x: 0, backdropFilter: 'blur(6px)' }}
                                exit={{ opacity: 0, y: 200, x: -200, backdropFilter: 'blur(0px)' }}
                                transition={{ duration: 0.4 }}
                                className="ActionPanel"
                            >
                                <div 
                                    onClick={() => { setActionPanelOpen(false) }}
                                    style={{ width: '100%', height: '100%', position: 'absolute' }}
                                ></div>
                                <div className="Buttons">
                                    <label htmlFor="M-FileInput">
                                        <I_ADD_FILE />
                                        {t('select_file')}
                                    </label>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            {/* Панель эмодзи как отдельный элемент структуры */}
            {!isMobile && emojiSidebarOpen && (
                <div className="Chat-EmojiPanel" style={{ width: localStorage.getItem('emojiSidebarWidth') || '320px' }}>
                    <div className="Header">
                        <div className="Title">{t('emoji_gallery')}</div>
                    </div>
                    <div 
                        className="Resize-Handle"
                        onMouseDown={(e) => {
                            const startX = e.clientX;
                            const startWidth = parseInt(localStorage.getItem('emojiSidebarWidth') || '320');
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                const newWidth = startWidth - (moveEvent.clientX - startX);
                                const emojiPanel = document.querySelector('.Chat-EmojiPanel') as HTMLElement;
                                
                                // Set min and max widths
                                if (emojiPanel && newWidth >= 250 && newWidth <= 500) {
                                    emojiPanel.style.width = `${newWidth}px`;
                                    localStorage.setItem('emojiSidebarWidth', `${newWidth}px`);
                                }
                            };
                            
                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    ></div>
                    <EmojiPicker
                        isOpen={true}
                        setIsOpen={() => {}}
                        buttonRef={emojiButtonRef}
                        inputRef={messageInputRef}
                        onEmojiSelect={(emoji: string) => {
                            const input = messageInputRef.current;
                            if (input) {
                                const currentText = input.value;
                                const newText = currentText + emoji;
                                input.value = newText;
                                const inputEvent = new Event('input', { bubbles: true });
                                input.dispatchEvent(inputEvent);
                            }
                        }}
                        className="sidebar-emoji-picker"
                    />
                </div>
            )}
        </div>
    );
}

export default Chat;
