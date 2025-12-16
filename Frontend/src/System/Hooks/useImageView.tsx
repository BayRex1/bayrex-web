import { useDispatch } from 'react-redux';
import { setImage, setImages, setOpen } from '../../Store/Slices/imageView';

export const useImageView = () => {
  const dispatch = useDispatch();

  const openImage = (payload: any) => {
    dispatch(setOpen(true));
    dispatch(setImage({
      neo_file: payload.neo_file,
      file_path: payload.file_path,
      metadata: payload.metadata,
    }));
  };

  const openImages = (payload) => {
    dispatch(setImages(payload));
  }

  return { openImage, openImages };
};