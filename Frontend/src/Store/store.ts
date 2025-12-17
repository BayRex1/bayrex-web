import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slices/auth';
import uiReducer from './Slices/ui';
import postsReducer from './Slices/posts';
import profilesReducer from './Slices/profiles';
import musicPlayerReducer from './Slices/musicPlayer';
import imageViewReducer from './Slices/imageView';
import messengerReducer from './Slices/messenger';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    posts: postsReducer,
    profiles: profilesReducer,
    musicPlayer: musicPlayerReducer,
    imageView: imageViewReducer,
    messenger: messengerReducer
  },
});

export default store;