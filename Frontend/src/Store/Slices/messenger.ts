import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    selectedChat: null,
    chatsList: [],
    chats: {
        0: {},
        1: {}
    },
    files: [],
    emojiSidebarOpen: localStorage.getItem('emojiSidebarOpen') === 'true' ? true : false
};

const messengerSlice = createSlice({
    name: 'messenger',
    initialState,
    reducers: {
        setChats: (state, action) => {
            state.chatsList = action.payload;
        },
        updateChat: (state: any, action) => {
            const { chat_id, chat_type, newData = {}, notificationsDelta } = action.payload;
        
            const index = state.chatsList.findIndex(chat => 
                chat?.target?.id === chat_id && chat?.target?.type === chat_type
            );
        
            if (index !== -1) {
                const baseNotifications = newData.hasOwnProperty('notifications') 
                    ? newData.notifications 
                    : (state.chatsList[index].notifications || 0);
        
                const updatedNotifications = notificationsDelta !== undefined
                    ? Math.max(baseNotifications + notificationsDelta, 0)
                    : baseNotifications;
        
                state.chatsList[index] = { 
                    ...state.chatsList[index], 
                    ...newData,
                    notifications: updatedNotifications
                };
            }
        },
        setChat: (state, action) => {
            state.selectedChat = action.payload;
        },
        updateSelectedChat: (state: any, action) => {
            const { chat_id, chat_type, newData } = action.payload;
            if (
                state.selectedChat && 
                state.selectedChat.id === chat_id && 
                state.selectedChat.type === chat_type
            ) {
                state.selectedChat = {
                    ...state.selectedChat,
                    ...newData
                };
            }
        },
        setMessagesLoaded: (state, action) => {
            const { chat_id, chat_type, value } = action.payload;
        
            if (!state.chats[chat_type]) state.chats[chat_type] = {};
            if (!state.chats[chat_type][chat_id]) state.chats[chat_type][chat_id] = {};
        
            state.chats[chat_type][chat_id].messagesLoaded = value;
        },
        setMessages: (state, action) => {
            const { chat_id, chat_type, messages } = action.payload;
        
            if (!state.chats[chat_type]) state.chats[chat_type] = {};
            if (!state.chats[chat_type][chat_id]) state.chats[chat_type][chat_id] = { messages: [] };
        
            const existingMessages = state.chats[chat_type][chat_id].messages;
        
            if (!Array.isArray(existingMessages)) {
                state.chats[chat_type][chat_id].messages = messages;
                return;
            }
        
            const newMessages = messages.filter(newMsg =>
                !existingMessages.some(oldMsg => oldMsg.mid === newMsg.mid)
            );
        
            state.chats[chat_type][chat_id].messages = [...existingMessages, ...newMessages];
        },
        addMessage: (state, action) => {
            const { chat_id, chat_type, message } = action.payload;
            
            if (!state.chats[chat_type]) state.chats[chat_type] = {};
            if (!state.chats[chat_type][chat_id]) {
                state.chats[chat_type][chat_id] = { messages: [] };
            }
        
            const messages = state.chats[chat_type][chat_id].messages || [];
            
            const existingMessage = messages.find(
                (msg) => (msg.mid && msg.mid === message.mid) || 
                         (msg.temp_mid && msg.temp_mid === message.temp_mid)
            );
        
            if (!existingMessage) {
                messages.push(message);
            } else {
                const index = messages.findIndex(
                    (msg) => msg.mid === message.mid
                );
                if (index !== -1) {
                    messages[index] = {
                        ...messages[index],
                        ...message
                    };
                }
            }
            
            state.chats[chat_type][chat_id].messages = messages;
        },
        updateMessage: (state, action) => {
            const { mid, temp_mid, chat_id, chat_type, newData } = action.payload;
        
            if (!state.chats[chat_type]) state.chats[chat_type] = {};
            if (!state.chats[chat_type][chat_id]) {
                state.chats[chat_type][chat_id] = { messages: [] };
            }
        
            const messages = state.chats[chat_type][chat_id].messages || [];
            const index = messages.findIndex(msg => 
                (mid && msg.mid === mid) || 
                (!mid && temp_mid && msg.temp_mid === temp_mid)
            );
        
            if (index !== -1) {
                messages[index] = { ...messages[index], ...newData };
        
                if (newData.mid) {
                    messages[index].mid = newData.mid;
                    delete messages[index].temp_mid;
                }
                
                state.chats[chat_type][chat_id].messages = messages;
            }
        },        
        updateDownloadProgress: (state, action) => {
            const { mid, chat_id, chat_type, progress } = action.payload;

            if (!state.chats[chat_type] || !state.chats[chat_type][chat_id]) return;

            const messagesArray = state.chats[chat_type][chat_id].messages;
            const index = messagesArray.findIndex(msg => msg.mid === mid);

            if (index !== -1) {
                const message = messagesArray[index];

                message.decrypted = message.decrypted || {};
                message.decrypted.file = message.decrypted.file || {};

                message.decrypted.file.download_progress = progress;
            }
        },
        toggleEmojiSidebar: (state) => {
            state.emojiSidebarOpen = !state.emojiSidebarOpen;
            localStorage.setItem('emojiSidebarOpen', state.emojiSidebarOpen.toString());
        },
        setFiles: (state: any, action) => {
            const { mid } = action.payload;

            const existingFiles = state.files.filter(file => file.mid !== mid);

            state.files = [...existingFiles, action.payload];
        }
    },
});

export const {
    setChats,
    updateChat,
    setChat,
    updateSelectedChat,
    setMessages,
    addMessage,
    setMessagesLoaded,
    updateMessage,
    updateDownloadProgress,
    setFiles,
    toggleEmojiSidebar
} = messengerSlice.actions;

export default messengerSlice.reducer;