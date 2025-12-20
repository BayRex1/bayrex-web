import { ReactNode, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { AnimatePresence, motion } from 'framer-motion';
import { Window } from '../../../System/Elements/Modal';
import HandleSong from '../Components/HandleSong';
import { PreloadSongs } from '../../../System/UI/Preload';
import { I_LIKE, I_SCROLL_BUTTON } from '../../../System/UI/IconPack';
import AddSong from '../Components/AddSong';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { AddButton } from '../../../UIKit';
import { useAuth } from '../../../System/Hooks/useAuth';
import { useParams } from 'react-router-dom';
import CreatePlaylist from '../Components/CreatePlaylist';
import { useDispatch, useSelector } from 'react-redux';
import { setLibrary } from '../../../Store/Slices/musicPlayer';

export interface Category {
    title: string;
    type: number;
    get?: string;
    items: any;
    loaded: boolean;
    startIndex: number;
}

interface HandleCategoryProps {
    category: Category;
    selectSong: (song: any, category: Category | null) => void;
    loadMore: (category: Category) => void;
}

const HandleCategory: React.FC<HandleCategoryProps> = ({ category, selectSong, loadMore }) => {
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { ref: endSpanRef, inView } = useInView({ threshold: 0 });

    useEffect(() => {
        if (inView) {
            loadMore(category);
        }
    }, [inView]);

    const animations = {
        hide: {
            opacity: 0,
            filter: 'blur(2px)'
        },
        show: {
            opacity: 1,
            filter: 'blur(0px)'
        }
    };

    const scrollLeft = () => {
        scrollRef.current?.scrollTo({
            left: (scrollRef.current?.scrollLeft || 0) - 350,
            behavior: 'smooth'
        });
    };

    const scrollRight = () => {
        scrollRef.current?.scrollTo({
            left: (scrollRef.current?.scrollLeft || 0) + 350,
            behavior: 'smooth'
        });
    };

    return (
        <div
            className="Music-List"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="Title">{category.title}</div>
            <div className="SH_L"></div>
            <div className="SH_R"></div>
            <AnimatePresence>
                {isHovered && (
                    <motion.button
                        onClick={scrollLeft}
                        className="ScrollButton SC-L"
                        initial="hide"
                        animate="show"
                        exit="hide"
                        variants={animations}
                    >
                        <I_SCROLL_BUTTON />
                    </motion.button>
                )}
            </AnimatePresence>
            <div ref={scrollRef} className="Scroll">
                {category.loaded ? (
                    (Array.isArray(category.items) && category.items.length > 0) && (
                        <>
                            {category.items.map((item) => (
                                <HandleSong
                                    key={item.id}
                                    item={item}
                                    category={category}
                                    selectSong={selectSong}
                                />
                            ))}
                            <span ref={endSpanRef}></span>
                        </>
                    )
                ) : (
                    <PreloadSongs />
                )}
            </div>
            <AnimatePresence>
                {isHovered && (
                    <motion.button
                        onClick={scrollRight}
                        className="ScrollButton SC-R"
                        initial="hide"
                        animate="show"
                        exit="hide"
                        variants={animations}
                    >
                        <I_SCROLL_BUTTON />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

const Main = ({ selectSong }) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const { accountData } = useAuth();
    const params = useParams<{ song_id: string }>();
    const playerState = useSelector((state: any) => state.musicPlayer);
    const dispatch = useDispatch();

    // Окно
    const [windowOpen, setWindowOpen] = useState<boolean>(false);
    const [windowTitle, setWindowTitle] = useState<string>('');
    const [windowContent, setWindowContent] = useState<ReactNode>('');
    const [windowClass, setWindowClass] = useState<string>('');
    const [windowContentClass, setWindowContentClass] = useState<string>('');

    // Категории
    const [categories, setCategories] = useState<Category[]>([
        {
            title: t('music_my'),
            type: 1,
            items: [
                {
                    id: 'fav',
                    type: 1,
                    title: t('music_favorites'),
                    author: {
                        name: accountData.name
                    },
                    cover: null,
                    icon: <I_LIKE />
                },
                ...playerState.my_library
            ],
            loaded: true,
            startIndex: 0
        },
        {
            title: t('music_latest'),
            type: 0,
            get: 'latest',
            items: [],
            loaded: false,
            startIndex: 0
        },
        {
            title: t('music_random'),
            type: 0,
            get: 'random',
            items: [],
            loaded: false,
            startIndex: 0
        }
    ]);

    useEffect(() => {
        setCategories(prevCategories =>
            prevCategories.map(cat => {
                if (cat.type !== 1) return cat;

                const favItem = cat.items.find(item => item.id === 'fav');

                const newLibrary = playerState.my_library.filter(item => item.id !== 'fav');

                const newItems = favItem
                    ? [favItem, ...newLibrary]
                    : newLibrary;

                return {
                    ...cat,
                    items: newItems,
                    loaded: true
                };
            })
        );
    }, [playerState.my_library]);

    useEffect(() => {
        wsClient.send({
            type: 'social',
            action: 'music/load_library'
        }).then((res: any) => {
            if (res.status === 'success') {
                dispatch(setLibrary(res.playlists));
            }
        });
        categories.forEach((category) => {
            wsClient.send({
                type: 'social',
                action: 'load_songs',
                songs_type: category.get,
                start_index: 0
            }).then((res: any) => {
                if (res.status === 'success') {
                    setCategories((prevCategories) =>
                        prevCategories.map((cat) =>
                            (cat.get === category.get) && (cat.type !== 3) ? { ...cat, items: res.songs, loaded: true } : cat
                        )
                    );
                }
            })
        });
    }, []);

    const openAddForm = () => {
        setWindowTitle(t('music_add'));
        setWindowContent(<AddSong />);
        setWindowClass('');
        setWindowContentClass('Music-AddFrom_content');
        setWindowOpen(true);
    };
    const closeCreatePlaylist = () => {
        setWindowOpen(false);
    }
    const openCreatePlaylist = () => {
        setWindowTitle(t('music_add_playlist'));
        setWindowContent(<CreatePlaylist close={closeCreatePlaylist} />);
        setWindowClass('');
        setWindowContentClass('MultiForm');
        setWindowOpen(true);
    };

    const loadMore = (category: Category) => {
        wsClient.send({
            type: 'social',
            action: 'load_songs',
            songs_type: category.get,
            start_index: category.startIndex + 25
        }).then((res: any) => {
            if (res.status === 'success') {
                setCategories((prevCategories) =>
                    prevCategories.map((cat) =>
                        cat.get === category.get
                            ? {
                                ...cat,
                                items: [...cat.items, ...res.songs],
                                loaded: true
                            }
                            : cat
                    )
                );
            }
        });
        setCategories((prevCategories) =>
            prevCategories.map((cat) =>
                cat.get === category.get ? { ...cat, startIndex: category.startIndex + 25 } : cat
            )
        );
    };

    useEffect(() => {
        if (params.song_id) {
            wsClient.send({
                type: 'social',
                action: 'load_song',
                song_id: params.song_id
            }).then((res: any) => {
                if (res.status === 'success') {
                    selectSong(res.song, null, null);
                }
            })
        }
    }, [params.song_id]);

    return (
        <>
            <div className="Music-Add UI-B_FIRST">
                <AddButton
                    title={t('music_add_playlist')}
                    onClick={openCreatePlaylist}
                />
                <AddButton
                    title={t('music_add_button')}
                    onClick={openAddForm}
                />
            </div>
            {categories.map((category, i) => (
                <HandleCategory
                    key={i}
                    category={category}
                    selectSong={selectSong}
                    loadMore={loadMore}
                />
            ))}
            <Window
                title={windowTitle}
                content={windowContent}
                className={windowClass}
                contentClass={windowContentClass}
                style={{ width: 'fit-content' }}
                isOpen={windowOpen}
                setOpen={setWindowOpen}
            />
        </>
    )
}

export default Main;
