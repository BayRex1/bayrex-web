import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMusicModal } from '../../../System/Context/MusicModal';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { I_SEARCH } from '../../../System/UI/IconPack';
import { MusicCover, TextInput } from '../../../UIKit';
import FormButton from '../Buttons/FormButton';
import '../../../System/UI/ModalMusic.scss';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  cover?: any;
}

type DisplayMode = 'search' | 'favorites' | 'new';

const MusicModal: React.FC = ({ onClose }: any) => {
  const { t } = useTranslation();
  const { selectedTracks, setSelectedTracks } = useMusicModal();
  const { wsClient } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('favorites');
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [newTracks, setNewTracks] = useState<Track[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [isNewTracksLoading, setIsNewTracksLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const favoritesTabRef = useRef<HTMLButtonElement>(null);
  const newTabRef = useRef<HTMLButtonElement>(null);

  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    transform: 'translateX(0px)',
  });

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    updateTabIndicator();
  }, [displayMode]);

  const updateTabIndicator = () => {
    if (displayMode === 'favorites' && favoritesTabRef.current) {
      const { offsetWidth, offsetLeft } = favoritesTabRef.current;
      setIndicatorStyle({
        width: offsetWidth,
        transform: `translateX(${offsetLeft}px)`,
      });
    } else if (displayMode === 'new' && newTabRef.current) {
      const { offsetWidth, offsetLeft } = newTabRef.current;
      setIndicatorStyle({
        width: offsetWidth,
        transform: `translateX(${offsetLeft}px)`,
      });
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 300);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchFavorites = async () => {
    setIsFavoritesLoading(true);

    wsClient.send({
      type: 'social',
      action: 'load_songs',
      songs_type: 'favorites',
      start_index: 0
    }).then((res) => {
      if (res && res.status === 'success' && res.songs) {
        setFavoriteTracks(res.songs);
      } else {
        setFavoriteTracks([]);
      }
      setIsFavoritesLoading(false);
    }).catch((error) => {
      console.error('Error fetching favorite tracks:', error);
      setFavoriteTracks([]);
      setIsFavoritesLoading(false);
    });
  };

  const toggleFavorites = async () => {
    if (displayMode === 'favorites') {
      setDisplayMode('search');
      return;
    }

    setDisplayMode('favorites');

    if (favoriteTracks.length === 0) {
      fetchFavorites();
    }
  };

  const toggleNewTracks = async () => {
    if (displayMode === 'new') {
      setDisplayMode('search');
      return;
    }

    setIsNewTracksLoading(true);
    setDisplayMode('new');

    wsClient.send({
      type: 'social',
      action: 'load_songs',
      songs_type: 'latest',
      start_index: 0
    }).then((res) => {
      if (res && res.status === 'success' && res.songs) {
        setNewTracks(res.songs);
      } else {
        setNewTracks([]);
      }
      setIsNewTracksLoading(false);
    }).catch((error) => {
      console.error('Error fetching new tracks:', error);
      setNewTracks([]);
      setIsNewTracksLoading(false);
    });
  };

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || trimmedQuery.length < 3) return;

    setIsLoading(true);
    setDisplayMode('search');

    wsClient.send({
      type: 'social',
      action: 'search',
      category: 'music',
      value: trimmedQuery
    }).then((res) => {
      if (res && res.status === 'success' && res.results) {
        const musicResults = res.results.filter(item => item.type === 'song');
        const tracks = musicResults.map(item => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
          cover: item.cover || null,
          duration: item.duration
        }));

        setSearchResults(tracks);
      } else {
        console.error('Search failed:', res?.message || 'Unknown error');
        setSearchResults([]);
      }
      setIsLoading(false);
    }).catch((error) => {
      console.error('Error searching music:', error);
      setSearchResults([]);
      setIsLoading(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleTrackSelection = (track: Track) => {
    if (selectedTracks.find(t => t.id === track.id)) {
      setSelectedTracks(selectedTracks.filter(t => t.id !== track.id));
    } else {
      if (selectedTracks.length < 100) {
        setSelectedTracks([...selectedTracks, track]);
      }
    }
  };

  const handleAddSelected = () => {
    onClose();
  };

  return (
    <div className="MusicModal">
      <div className="SearchContainer">
        <div className="SearchInputWrapper">
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('music_search_placeholder')}
          />
          <button
            className="SearchButton"
            onClick={handleSearch}
            disabled={isLoading}
          >
            <I_SEARCH />
          </button>
        </div>

        <div className="SelectedCounter">
          {selectedTracks.length > 0 ?
            t('music_selected_count', { count: selectedTracks.length }) :
            t('music_select_tracks')
          }
        </div>

        <div className="TabsContainer">
          <div className="TabsHeader">
            <button
              ref={favoritesTabRef}
              className={`TabButton ${displayMode === 'favorites' ? 'Active' : ''}`}
              onClick={toggleFavorites}
            >
              {t('music_tab_favorites')}
            </button>
            <button
              ref={newTabRef}
              className={`TabButton ${displayMode === 'new' ? 'Active' : ''}`}
              onClick={toggleNewTracks}
            >
              {t('music_tab_new')}
            </button>
            <div
              className="TabIndicator"
              style={indicatorStyle}
            />
          </div>

          <div className="TabContent">
            {displayMode === 'favorites' ? (
              isFavoritesLoading ? (
                <div className="LoadingIndicator">{t('music_loading')}</div>
              ) : favoriteTracks.length > 0 ? (
                <div className="TrackList">
                  {favoriteTracks.map((track) => (
                    <button
                      key={track.id}
                      className={`TrackItem ${selectedTracks.find(t => t.id === track.id) ? 'Selected' : ''}`}
                      onClick={() => toggleTrackSelection(track)}
                    >
                      <div className="TrackCover">
                        <MusicCover
                          cover={track.cover}
                          width={40}
                          borderRadius={4}
                        />
                      </div>
                      <div className="TrackInfo">
                        <div className="TrackTitle">{track.title}</div>
                        <div className="TrackArtist">{track.artist}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="EmptyTabMessage">{t('music_no_favorites')}</div>
              )
            ) : displayMode === 'new' ? (
              isNewTracksLoading ? (
                <div className="LoadingIndicator">{t('music_loading')}</div>
              ) : newTracks.length > 0 ? (
                <div className="TrackList">
                  {newTracks.map((track) => (
                    <button
                      key={track.id}
                      className={`TrackItem ${selectedTracks.find(t => t.id === track.id) ? 'Selected' : ''}`}
                      onClick={() => toggleTrackSelection(track)}
                    >
                      <div className="TrackCover">
                        <MusicCover
                          cover={track.cover}
                          width={40}
                          borderRadius={4}
                        />
                      </div>
                      <div className="TrackInfo">
                        <div className="TrackTitle">{track.title}</div>
                        <div className="TrackArtist">{track.artist}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="EmptyTabMessage">{t('music_no_new_tracks')}</div>
              )
            ) : isLoading ? (
              <div className="LoadingIndicator">{t('music_loading')}</div>
            ) : searchResults.length > 0 ? (
              <div className="TrackList">
                {searchResults.map((track) => (
                  <button
                    key={track.id}
                    className={`TrackItem ${selectedTracks.find(t => t.id === track.id) ? 'Selected' : ''}`}
                    onClick={() => toggleTrackSelection(track)}
                  >
                    <div className="TrackCover">
                      <MusicCover
                        cover={track.cover}
                        width={40}
                        borderRadius={4}
                      />
                    </div>
                    <div className="TrackInfo">
                      <div className="TrackTitle">{track.title}</div>
                      <div className="TrackArtist">{track.artist}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="NoResults">{t('music_no_results')}</div>
            ) : (
              <div className="EmptySearchMessage">
                {t('music_start_search')}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedTracks.length > 0 && (
        <div className="Footer">
          <FormButton
            title={t('music_add_selected')}
            onClick={handleAddSelected}
            className="AddTracksButton"
          />
        </div>
      )}
    </div>
  );
};

export default MusicModal;