import { createSelector } from '@reduxjs/toolkit';

type RootState = any;
const selectPostsSlice = (state: RootState) => state.posts;

const selectCategories = createSelector(
  [selectPostsSlice],
  postsSlice => postsSlice.categories
);

export const selectCategoryState = createSelector(
  [
    selectCategories,
    (_: RootState, category: 'last' | 'rec' | 'subscribe') => category
  ],
  (categories, category) => {
    return categories[category] ?? { si: 0, loaded: false, hasMore: false, ids: [] };
  }
);

export const selectPostIdsByCategory = createSelector(
  [
    selectCategoryState
  ],
  categoryState => {
    return categoryState.ids;
  }
);

const selectPostsById = createSelector(
  [selectPostsSlice],
  postsSlice => postsSlice.byId
);

export const selectPostsByCategory = createSelector(
  [
    selectPostIdsByCategory,
    selectPostsById
  ],
  (ids, byId) => {
    return ids.map(id => byId[id]).filter(p => p != null);
  }
);

export const selectCategorySi = createSelector(
  [selectCategoryState],
  categoryState => categoryState.si
);
export const selectCategoryLoaded = createSelector(
  [selectCategoryState],
  categoryState => categoryState.loaded
);
export const selectCategoryHasMore = createSelector(
  [selectCategoryState],
  categoryState => categoryState.hasMore
);
