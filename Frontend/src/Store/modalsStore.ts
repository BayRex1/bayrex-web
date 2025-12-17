import { create } from 'zustand';

type ModalType = {
    id: number;
    type: string;
    props?: Record<string, any>;
    isClosing?: boolean;
    uniqueKey?: string;
};

let idCounter = 0;
const MAX_MODALS = 3;
const DEBOUNCE_TIME = 300;
let lastModalTime = 0;

interface ModalsState {
    stack: ModalType[];

    openModal: (modal: Omit<ModalType, 'id' | 'isClosing'>) => number | null;
    startClosingModal: (id: number) => void;
    removeModal: (id: number) => void;
    forceRemoveModal: (id: number) => void;
    closeAllModals: () => void;
}

export const useModalsStore = create<ModalsState>((set, _) => ({
    stack: [],

    openModal: (modal) => {
        let modalId: number | null = null;
        
        set((state) => {
            const now = Date.now();
            
            if (now - lastModalTime < DEBOUNCE_TIME) {
                console.warn('Слишком быстрое открытие модальных окон');
                return state;
            }
            
            const activeModals = state.stack.filter(m => !m.isClosing);
            
            if (activeModals.length >= MAX_MODALS) {
                console.warn(`Достигнут лимит модальных окон (${MAX_MODALS})`);
                return state;
            }

            const uniqueKey = modal.uniqueKey || `${modal.type}_${JSON.stringify(modal.props || {})}`;
            const existingModal = activeModals.find(m => m.uniqueKey === uniqueKey);
            
            if (existingModal) {
                console.warn(`Модальное окно с ключом "${uniqueKey}" уже открыто`);
                return state;
            }

            const id = ++idCounter;
            modalId = id;
            lastModalTime = now;
            const newModal = { ...modal, id, isClosing: false, uniqueKey };
            
            return {
                stack: [...state.stack, newModal],
            };
        });
        
        return modalId;
    },

    startClosingModal: (id) => {
        set((state) => ({
            stack: state.stack.map((m) =>
                m.id === id ? { ...m, isClosing: true } : m
            ),
        }));
    },

    removeModal: (id) => {
        set((state) => ({
            stack: state.stack.filter((m) => m.id !== id),
        }));
    },

    forceRemoveModal: (id) => {
        set((state) => ({
            stack: state.stack.filter((m) => m.id !== id),
        }));
    },

    closeAllModals: () => {
        set({ stack: [] });
    },
}));

export const useModalControls = () => {
    const openModal = useModalsStore(state => state.openModal);
    const startClosingModal = useModalsStore(state => state.startClosingModal);
    const closeAllModals = useModalsStore(state => state.closeAllModals);
    
    const safeOpenModal = (modal: Omit<ModalType, 'id' | 'isClosing'>, showAlert = true) => {
        const modalId = openModal(modal);
        
        if (modalId === null && showAlert) {
            const errorMessage = modal.uniqueKey 
                ? 'Такое модальное окно уже открыто!'
                : 'Слишком много открытых окон!';
                
            openModal({
                type: 'alert',
                props: {
                    title: 'Ограничение',
                    description: errorMessage,
                    confirmText: 'Понятно'
                },
                uniqueKey: 'modal_limit_warning'
            });
        }
        
        return modalId;
    };
    
    return {
        openModal: safeOpenModal,
        closeModal: startClosingModal,
        closeAllModals
    };
};