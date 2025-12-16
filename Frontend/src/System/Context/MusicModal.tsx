import { createContext, useState, useContext } from 'react';

interface MusicModalContextProps {
  isOpen: boolean;
  openMusicModal: () => void;
  closeMusicModal: () => void;
  selectedTracks: any[];
  setSelectedTracks: (tracks: any[]) => void;
}

const MusicModalContext = createContext<MusicModalContextProps>({
  isOpen: false,
  openMusicModal: () => {},
  closeMusicModal: () => {},
  selectedTracks: [],
  setSelectedTracks: () => {},
});

export const useMusicModal = () => useContext(MusicModalContext);

export const MusicModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<any[]>([]);

  const openMusicModal = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeMusicModal = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <MusicModalContext.Provider value={{ 
      isOpen, 
      openMusicModal, 
      closeMusicModal, 
      selectedTracks, 
      setSelectedTracks 
    }}>
      {children}
    </MusicModalContext.Provider>
  );
}; 