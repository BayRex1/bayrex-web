import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    byType: {
        0: {
            byId: {},
            meta: {},
            posts: {},
            allIds: []
        },
        1: {
            byId: {},
            meta: {},
            posts: {},
            allIds: []
        }
    },
    byUsername: {}
};

const profilesSlice = createSlice({
    name: 'profiles',
    initialState,
    reducers: {
        setProfile(state, action) {
            const { type, profile } = action.payload;
            const id = profile.id;
            const username = profile.username;

            state.byType[type].byId[id] = profile;
            state.byType[type].meta[id] = {
                loaded: true,
                lastFetched: Date.now()
            };

            if (!state.byType[type].allIds.includes(id)) {
                state.byType[type].allIds.push(id);
            }

            if (username) {
                state.byUsername[username] = { id, type };
            }
        },

        updateProfile(state, action) {
            const { type, profile } = action.payload;
            const id = profile.id;
            const username = profile.username;

            if (state.byType[type].byId[id]) {
                const oldUsername = state.byType[type].byId[id].username;

                state.byType[type].byId[id] = {
                    ...state.byType[type].byId[id],
                    ...profile
                };

                if (username && username !== oldUsername) {
                    if (oldUsername) {
                        delete state.byUsername[oldUsername];
                    }
                    state.byUsername[username] = { id, type };
                }
            }
        },

        setProfilePosts(state, action) {
            const { id, type, posts, start_index } = action.payload;
            if (!state.byType[type]?.byId[id]) return;

            state.byType[type].posts[id] = posts.map(post => post.id);
            state.byType[type].meta[id].start_index = start_index;
        },

        setProfilePostsLoaded(state, action) {
            const { id, type, value } = action.payload;
            state.byType[type].meta[id].postsLoaded = value;
        },

        addProfilePosts(state, action) {
            const { id, type, posts } = action.payload;
            if (!state.byType[type]?.byId[id]) return;

            const existing: number[] = state.byType[type].posts[id] || [];
            const existingSet = new Set(existing);
            const newIds: number[] = posts
                .map(post => post.id)
                .filter(pid => !existingSet.has(pid));

            const combined = [...existing, ...newIds];
            state.byType[type].posts[id] = combined;

            const meta = state.byType[type].meta[id];
            if (meta) {
                meta.start_index = combined.length;
            }
        },

        clearProfile(state, action) {
            const { id, type } = action.payload;

            if (!state.byType[type]?.byId[id]) return;

            const username = state.byType[type].byId[id].username;

            delete state.byType[type].byId[id];
            delete state.byType[type].meta[id];
            delete state.byType[type].posts[id];
            state.byType[type].allIds = state.byType[type].allIds.filter(_id => _id !== id);

            if (username && state.byUsername[username]) {
                delete state.byUsername[username];
            }
        }
    }
});

export const {
    setProfile,
    updateProfile,
    setProfilePosts,
    addProfilePosts,
    setProfilePostsLoaded,
    clearProfile
} = profilesSlice.actions;

export default profilesSlice.reducer;