import { createSelector } from '@reduxjs/toolkit';

const selectProfileInfo = (state, username) => state.profiles.byUsername[username] || null;
const selectByTypeBranch = (state) => state.profiles.byType;

export const selectProfileIdAndType = createSelector(
  [selectProfileInfo],
  (profileInfo) => {
    if (!profileInfo) {
      return { id: null, type: null };
    }
    return { id: profileInfo.id, type: profileInfo.type };
  }
);

export const selectProfileByUsername = createSelector(
  [
    (state, username) => state.profiles.byUsername[username] || null,
    (state) => state.profiles.byType
  ],
  (profileInfo, byType) => {
    if (!profileInfo) return null;
    const { id, type } = profileInfo;
    return byType[type]?.byId[id] || null;
  }
);

export const selectProfileMetaByUsername = createSelector(
  [
    selectProfileInfo,
    selectByTypeBranch
  ],
  (profileInfo, byType) => {
    if (!profileInfo) return null;
    const { id, type } = profileInfo;
    const meta = byType[type]?.meta?.[id] || null;
    if (!meta) return null;
    return {
      loaded: meta.loaded ?? false,
      postsLoaded: meta.postsLoaded ?? false,
      start_index: meta.start_index ?? 0,
      lastFetched: meta.lastFetched
    }
  }
);

export const selectProfilePosts = (state: any, id: number, type: string) => {
  const numericType = (type === 'user' ? 0 : 1);
  const postIds: number[] = state.profiles.byType[numericType]?.posts[id] || [];
  return postIds.map(pid => state.posts.byId[pid]).filter(Boolean);
};