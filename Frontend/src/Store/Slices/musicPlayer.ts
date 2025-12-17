import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Song {
    id: number;
    title: string;
    artist: string;
    old_cover?: string | null;
    cover?: any;
    liked: boolean | null;
    duration: number;
}

interface MusicPlayerState {
    my_library: any;
    songData: Song & { loaded: boolean };
    selected: boolean;
    playing: boolean;
    random: boolean;
    loop: boolean;
    duration: number;
    currentTime: number;
    desiredTime: number | null;
    volume: number;
    songsQueue: Song[];
    currentSongIndex: number;
}

const initialState: MusicPlayerState = {
    my_library: [],
    songData: {
        id: 0,
        loaded: false,
        title: 'Пусто',
        artist: 'пусто',
        old_cover: null,
        cover: null,
        liked: false,
        duration: 0
    },
    selected: false,
    playing: false,
    random: false,
    loop: false,
    duration: 0,
    currentTime: 0,
    desiredTime: null,
    volume: 1,
    songsQueue: [],
    currentSongIndex: 0
};

const musicPlayerSlice = createSlice({
    name: 'musicPlayer',
    initialState,
    reducers: {
        setSong: (state, action: PayloadAction<Song>) => {
            const idx = state.songsQueue.findIndex(song => song.id === action.payload.id);
            if (idx !== -1) {
                state.currentSongIndex = idx;
            }

            state.songData.id = action.payload.id;
            state.songData.title = action.payload.title;
            state.songData.artist = action.payload.artist;
            state.songData.old_cover = state.songData.cover;
            state.songData.cover = action.payload.cover;
            state.songData.liked = action.payload.liked;
            state.songData.duration = action.payload.duration;
            state.songData.loaded = true;
            state.selected = true;
        },
        setLibrary: (state, action) => {
            state.my_library = action.payload;
        },
        setPlay: (state, action: PayloadAction<boolean>) => {
            state.playing = action.payload;
        },
        setDuration: (state, action: PayloadAction<number>) => {
            state.duration = action.payload;
        },
        setCurrentTime: (state, action: PayloadAction<number>) => {
            state.currentTime = action.payload;
        },
        setDesiredTime: (state, action: PayloadAction<number | null>) => {
            state.desiredTime = action.payload;
        },
        setRandom: (state, action: PayloadAction<boolean>) => {
            state.random = action.payload;
        },
        setLoop: (state, action: PayloadAction<boolean>) => {
            state.loop = action.payload;
        },
        setVolume: (state, action: PayloadAction<number>) => {
            state.volume = action.payload;
        },
        addToQueue: (state, action: PayloadAction<Song[]>) => {
            state.songsQueue = action.payload;
            state.currentSongIndex = 0;
        },
        removePlaylist: (state, action: PayloadAction<any>) => {
            state.my_library = state.my_library.filter((playlist: any) => playlist.id !== action.payload);
        },
        toggleLike: (state, action: PayloadAction<number>) => {
            const songIndex = state.songsQueue.findIndex(song => song.id === action.payload);
            if (songIndex !== -1) {
                state.songsQueue[songIndex] = {
                    ...state.songsQueue[songIndex],
                    liked: !state.songsQueue[songIndex].liked
                };
            }
            if (state.songData.id === action.payload) {
                state.songData.liked = !state.songData.liked;
            }
        },
        nextSong: (state) => {
            if (state.songsQueue.length > 0) {
                if (state.random) {
                    state.currentSongIndex = Math.floor(Math.random() * state.songsQueue.length);
                } else {
                    state.currentSongIndex =
                        (state.currentSongIndex + 1) % state.songsQueue.length;
                }
                const next = state.songsQueue[state.currentSongIndex];
                state.songData = {
                    ...next,
                    old_cover: state.songData.cover,
                    loaded: true
                };
                state.selected = true;
            }
        },
        prevSong: (state) => {
            if (state.songsQueue.length > 0) {
                if (state.random) {
                    state.currentSongIndex = Math.floor(Math.random() * state.songsQueue.length);
                } else {
                    state.currentSongIndex =
                        state.currentSongIndex === 0
                            ? state.songsQueue.length - 1
                            : state.currentSongIndex - 1;
                }
                const prev = state.songsQueue[state.currentSongIndex];
                state.songData = {
                    ...prev,
                    old_cover: state.songData.cover,
                    loaded: true
                };
                state.selected = true;
            }
        },
        clearPlayer: (state) => {
            state.selected = false;
            state.playing = false;
            state.songData = {
                id: 0,
                loaded: false,
                title: 'Пусто',
                artist: 'пусто',
                old_cover: null,
                cover: null,
                liked: false,
                duration: 0
            };
            state.songsQueue = [];
            state.currentSongIndex = 0;
            state.currentTime = 0;
            state.duration = 0;
            state.desiredTime = null;
        }
    }
});

export const {
    setSong,
    setLibrary,
    setPlay,
    setRandom,
    setLoop,
    setDuration,
    setCurrentTime,
    setDesiredTime,
    setVolume,
    addToQueue,
    removePlaylist,
    toggleLike,
    nextSong,
    prevSong,
    clearPlayer
} = musicPlayerSlice.actions;
export default musicPlayerSlice.reducer;
