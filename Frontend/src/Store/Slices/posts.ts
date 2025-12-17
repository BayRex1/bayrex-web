import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Post {
    id: string;
    author: {
        username: string;
        name: string;
        avatar: string;
        icons?: any;
        blocked?: boolean;
    };
    content: any;
    likes: number;
    dislikes: number;
}

export type CategoryKey = 'last' | 'rec' | 'subscribe';

export interface CategoryState {
    si: number;
    loaded: boolean;
    hasMore: boolean;
    ids: string[];
}

export interface PostsState {
    byId: Record<string, Post>;
    allIds: string[];
    categories: Record<CategoryKey, CategoryState>;
}

const PAGE_SIZE = 25;

const initialState: PostsState = {
    byId: {},
    allIds: [],
    categories: {
        last: {
            si: 0,
            loaded: false,
            hasMore: true,
            ids: [],
        },
        rec: {
            si: 0,
            loaded: false,
            hasMore: true,
            ids: [],
        },
        subscribe: {
            si: 0,
            loaded: false,
            hasMore: true,
            ids: [],
        },
    },
};

const postsSlice = createSlice({
    name: 'posts',
    initialState,
    reducers: {
        addPosts(state, action: PayloadAction<Post[]>) {
            action.payload.forEach(post => {
                state.byId[post.id] = post;
                if (!state.allIds.includes(post.id)) {
                    state.allIds.push(post.id);
                }
            });
        },

        setCategoryPosts(
            state,
            action: PayloadAction<{
                category: CategoryKey;
                posts: Post[];
            }>
        ) {
            const { category, posts } = action.payload;
            const catState = state.categories[category];
            catState.ids = [];
            catState.si = 0;
            catState.hasMore = true;
            posts.forEach(post => {
                state.byId[post.id] = post;
                catState.ids.push(post.id);
                if (!state.allIds.includes(post.id)) {
                    state.allIds.push(post.id);
                }
            });
            catState.loaded = true;
            catState.si = posts.length;
            if (posts.length < PAGE_SIZE) {
                catState.hasMore = false;
            }
        },

        appendCategoryPosts(
            state,
            action: PayloadAction<{
                category: CategoryKey;
                posts: Post[];
            }>
        ) {
            const { category, posts } = action.payload;
            const catState = state.categories[category];
            posts.forEach(post => {
                state.byId[post.id] = post;
                if (!catState.ids.includes(post.id)) {
                    catState.ids.push(post.id);
                }
                if (!state.allIds.includes(post.id)) {
                    state.allIds.push(post.id);
                }
            });
            catState.si += posts.length;
            if (posts.length < PAGE_SIZE) {
                catState.hasMore = false;
            }
        },

        clearCategory(state, action: PayloadAction<CategoryKey>) {
            const category = action.payload;
            const catState = state.categories[category];
            catState.ids = [];
            catState.si = 0;
            catState.loaded = false;
            catState.hasMore = true;
        },

        removePost(state, action: PayloadAction<string>) {
            const id = action.payload;
            if (state.byId[id]) {
                delete state.byId[id];
                (Object.keys(state.categories) as CategoryKey[]).forEach(cat => {
                    state.categories[cat].ids = state.categories[cat].ids.filter(pid => pid !== id);
                });
                state.allIds = state.allIds.filter(pid => pid !== id);
            }
        },

        updatePost(state, action: PayloadAction<Post>) {
            const post = action.payload;
            if (state.byId[post.id]) {
                state.byId[post.id] = post;
            }
        },

        addNewPost(
            state,
            action: PayloadAction<{
                post: Post;
                categoriesToInsert: CategoryKey[];
            }>
        ) {
            const { post, categoriesToInsert } = action.payload;
            state.byId[post.id] = post;
            categoriesToInsert.forEach(category => {
                const catState = state.categories[category];
                if (!catState.ids.includes(post.id)) {
                    catState.ids.unshift(post.id);
                }
            });
            if (!state.allIds.includes(post.id)) {
                state.allIds.unshift(post.id);
            }
        },

        clearAll(state) {
            state.byId = {};
            state.allIds = [];
            (Object.keys(state.categories) as CategoryKey[]).forEach(cat => {
                state.categories[cat] = {
                    si: 0,
                    loaded: false,
                    hasMore: true,
                    ids: [],
                };
            });
        },
    },
});

export const {
    setCategoryPosts,
    appendCategoryPosts,
    clearCategory,
    removePost,
    updatePost,
    addNewPost,
    clearAll,
    addPosts
} = postsSlice.actions;

export default postsSlice.reducer;
