import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavButton } from '.';
import { useWebSocket } from '../../System/Context/WebSocket';
import classNames from 'classnames';
import BaseConfig from '../../Configs/Base';
import { useTranslation } from 'react-i18next';
import { Avatar, MusicCover, User } from '../../UIKit';
import { useNavigate } from 'react-router-dom';
import NeoImage from '../../UIKit/Components/Base/NeoImage';

const HandleUser = ({ user }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/e/${user.username}`)
    }

    return (
        <User
            user={user}
            onClick={handleClick}
        />
    )
}

const HandlePost = ({ post }) => {
    const HandleImages = ({ images }) => {
        return (
            <div className="Images">
                {
                    images.slice(0, 15).map((image: any, i: number) => (
                        <div key={i} className="Image">
                            <NeoImage
                                image={image.img_data}
                            />
                        </div>
                    ))
                }
            </div>
        )
    }

    return (
        <NavButton
            to={`/post/${post.id}`}
            className="UI-ListElement"
        >
            <Avatar
                avatar={post.author.avatar}
                name={post.author.name}
                size={40}
                className="PostAvatar"
            />
            <div className="Body">
                <div className="Desc">{post.author.name}</div>
                <div className="Title">{post.text}</div>
                {
                    post.content && (
                        <>
                            {post.content.Image && (
                                <HandleImage image={post.content.Image} />
                            )}
                            {post.content.images && (
                                <HandleImages images={post.content.images} />
                            )}
                        </>
                    )
                }
            </div>
        </NavButton>
    )
}

const HandleSong = ({ song }) => {
    return (
        <NavButton
            to={`/music/id/${song.id}`}
            className="UI-ListElement"
        >
            <MusicCover
                cover={song.cover}
                width={40}
                borderRadius={8}
                shadows={false}
            />
            <div className="Body">
                <div className="Title">{song.title}</div>
                <div className="Desc">{song.artist}</div>
            </div>
        </NavButton>
    )
}

const SearchResult = ({ searchValue }) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [searchLoaded, setSearchLoaded] = useState<boolean>(false);
    const [searchCategory, setSearchCategory] = useState<string>('all');
    const [results, setResults] = useState<any>([]);
    const theme: any = localStorage.getItem('S-Theme');

    useEffect(() => {
        if (searchValue.length > 0 && !searchOpen) {
            setSearchOpen(true);
        } else if (searchValue.length === 0) {
            setSearchOpen(false);
        }

        if (searchValue) {
            wsClient.send({
                type: 'social',
                action: 'search',
                category: searchCategory,
                value: searchValue,
            }).then((res: any) => {
                if (res.status === 'success') {
                    setResults(res.results);
                    setSearchLoaded(true);
                }
            })
        }
    }, [searchValue, searchCategory]);

    const variants = {
        hidden: {
            opacity: 0,
            y: -150,
            filter: theme === 'LIGHT-LG' ? 'none' : 'blur(10px)'
        },
        visible: {
            opacity: 1,
            y: 0,
            filter: theme === 'LIGHT-LG' ? 'none' : 'blur(0px)'
        }
    }

    const tabs = [
        {
            title: t('search_category_all'),
            category: 'all'
        },
        {
            title: t('search_category_users'),
            category: 'users'
        },
        {
            title: t('search_category_channels'),
            category: 'channels'
        },
        {
            title: t('search_category_posts'),
            category: 'posts'
        },
        {
            title: t('search_category_music'),
            category: 'music'
        }
    ]

    return (
        <AnimatePresence>
            {
                searchOpen && (
                    <motion.div
                        className="Search-Result"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={variants}
                    >
                        <div className="Category">
                            <div className="BUTTons">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.category}
                                        onClick={() => setSearchCategory(tab.category)}
                                        className={classNames({ Active: searchCategory === tab.category })}
                                    >
                                        {tab.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="UI-ScrollView">
                            {
                                searchLoaded ? (
                                    <div className="Results">
                                        {
                                            results.length > 0 ? (
                                                results.map((result: any) => (
                                                    result.type === 'user' ? <HandleUser key={`user-${result.id}`} user={result} /> :
                                                        result.type === 'channel' ? <HandleUser key={`channel-${result.id}`} user={result} /> :
                                                            result.type === 'post' ? <HandlePost key={`post-${result.id}`} post={result} /> :
                                                                result.type === 'song' ? <HandleSong key={`song-${result.id}`} song={result} /> :
                                                                    null
                                                ))
                                            ) : (
                                                <div className="Error">
                                                    {t('ups')}
                                                </div>
                                            )
                                        }
                                    </div>
                                ) : (
                                    <div className="Error">
                                        {'Загрузка...'}
                                    </div>
                                )
                            }
                        </div>
                    </motion.div>
                )
            }
        </AnimatePresence>
    )
}

export default SearchResult;
