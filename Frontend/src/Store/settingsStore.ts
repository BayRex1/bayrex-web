import { create } from "zustand";

type ThemeID =
    | 'LIGHT'
    | 'LIGHT-LG'
    | 'GOLD'
    | 'DARK'
    | 'DARK-LG'
    | 'GOLD-DARK'
    | 'GOLD-DARK-LG'
    | 'AMOLED'
    | 'AMOLED-GOLD'
    | 'AMOLED-GOLD-LG'
    | 'AMOLED-LG'
    | 'GOLD-LG';

const DEFAULT_SETTINGS = {
    theme: 'LIGHT' as ThemeID,
    showOnlineUsers: true,
    autoVideoDownload: false,
    doubleClickLike: true,
    hideProfileAnimation: true
};

function loadBool(key: string, defaultValue: boolean): boolean {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return value === 'true';
}

function loadTheme(key: string, defaultValue: ThemeID): ThemeID {
    const value = localStorage.getItem(key);
    if (!value) return defaultValue;
    const allowed: ThemeID[] = [
        'LIGHT', 'LIGHT-LG', 'GOLD', 'GOLD-LG', 'DARK', 'DARK-LG', 'GOLD-DARK', 'GOLD-DARK-LG', 'AMOLED', 'AMOLED-GOLD', 'AMOLED-GOLD-LG', 'AMOLED-LG'
    ];
    return allowed.includes(value as ThemeID) ? (value as ThemeID) : defaultValue;
}

interface SettingsStore {
    theme: ThemeID;
    showOnlineUsers: boolean;
    autoVideoDownload: boolean;
    doubleClickLike: boolean;
    hideProfileAnimation: boolean;
    setTheme: (t: ThemeID) => void;
    setShowOnlineUsers: (v: boolean) => void;
    setAutoDownload: (v: boolean) => void;
    setDoubleClickLike: (v: boolean) => void;
    setHideProfileAnimation: (v: boolean) => void;
}

const useSettingsStore = create<SettingsStore>((set) => ({
    theme: loadTheme('S-Theme', DEFAULT_SETTINGS.theme),
    showOnlineUsers: loadBool('S-ShowOnlineUsers', DEFAULT_SETTINGS.showOnlineUsers),
    autoVideoDownload: loadBool('S-AutoVideoDownload', DEFAULT_SETTINGS.autoVideoDownload),
    doubleClickLike: loadBool('S-DoubleClickLike', DEFAULT_SETTINGS.doubleClickLike),
    hideProfileAnimation: loadBool('S-HideProfileAnimation', DEFAULT_SETTINGS.hideProfileAnimation),

    setTheme: (theme) => {
        localStorage.setItem('S-Theme', theme);
        set({ theme });
    },
    setShowOnlineUsers: (value) => {
        localStorage.setItem('S-ShowOnlineUsers', String(value));
        set({ showOnlineUsers: value });
    },
    setAutoDownload: (value) => {
        localStorage.setItem('S-AutoVideoDownload', String(value));
        set({ autoVideoDownload: value });
    },
    setDoubleClickLike: (value) => {
        localStorage.setItem('S-DoubleClickLike', String(value));
        set({ doubleClickLike: value });
    },
    setHideProfileAnimation: (value) => {
        localStorage.setItem('S-HideProfileAnimation', String(value));
        set({ hideProfileAnimation: value });
    }
}));

export default useSettingsStore;
