import { createSlice } from '@reduxjs/toolkit';

interface Metadata {
  file_name: string;
  file_size: number;
}

interface Selected {
  file_path?: string | null;
  neo_file?: any | null;
  metadata: Metadata;
}

export interface ImageViewState {
  isOpen: boolean;
  selected: Selected;
  images: any[];
}

const initialState: ImageViewState = {
  isOpen: false,
  selected: {
    file_path: null,
    neo_file: null,
    metadata: {
      file_name: 'пусто',
      file_size: 0,
    },
  },
  images: [],
};

const imageViewSlice = createSlice({
  name: 'imageView',
  initialState,
  reducers: {
    setOpen: (state, action) => {
      state.isOpen = action.payload;
    },
    setImage: (state, action) => {
      const { file_path, neo_file, metadata } = action.payload;

      if (neo_file) {
        state.selected.neo_file = neo_file;
        state.selected.file_path = null;
      } else if (file_path) {
        state.selected.file_path = file_path;
        state.selected.neo_file = null;
      }

      if (metadata) {
        state.selected.metadata = metadata;
      }
    },
    setImages: (state, action) => {
      state.images = action.payload;
    },
  },
});

export const { setOpen, setImage, setImages } = imageViewSlice.actions;
export default imageViewSlice.reducer;
