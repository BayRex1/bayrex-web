import { useCallback, useEffect, useRef, useState } from 'react';
import { PreloadPosts } from '../../System/UI/Preload';
import { useInView } from 'react-intersection-observer';
import GoldUsers from '../../System/Elements/GoldUsers';
import { useTranslation } from 'react-i18next';
import Update from './Components/Update';
import { DefaultBanner } from '../../Components/Ad';
import OnlineUsers from './Components/OnlineUsers';
import { useWebSocket } from '../../System/Context/WebSocket';
import { useAuth } from '../../System/Hooks/useAuth';
import Post from '../../Components/Post';
import AddPost from '../../UIKit/Components/Layout/AddPost';
import { useDispatch, useSelector } from 'react-redux';
import {
    setCategoryPosts,
    appendCategoryPosts,
    clearCategory
} from '../../Store/Slices/posts';
import classNames from 'classnames';
import { selectCategoryState, selectPostsByCategory } from '../../Store/Selectors/postsSelectors';
import useSettingsStore from '../../Store/settingsStore';
import { Ring } from 'ldrs/react';

const Home = () => {
    const { showOnlineUsers } = useSettingsStore();
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    const { isSocketAuthorized } = useAuth();
    const dispatch = useDispatch();
    const postsRef = useRef<HTMLDivElement>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isMoreLoading, setIsMoreLoading] = useState(false);
    const [postsCategory, setPostsCategory] = useState<'last' | 'rec' | 'subscribe'>(
        (localStorage.getItem('S-PostsType') as 'last' | 'rec' | 'subscribe') || 'last'
    );
    const categoryState = useSelector((state) =>
        selectCategoryState(state, postsCategory)
    );
    const { si, loaded, hasMore } = categoryState;

    const posts = useSelector((state) =>
        selectPostsByCategory(state, postsCategory)
    );

    const { ref: postsEndRef, inView: postsEndIsView } = useInView({
        threshold: 0,
    });

    const loadPosts = useCallback(
        async ({ type, startIndex }: { type: string; startIndex: number }) => {
            try {
                const data = await wsClient.send({
                    type: 'social',
                    action: 'load_posts',
                    payload: {
                        posts_type: type,
                        start_index: startIndex,
                    },
                });
                if (data && Array.isArray(data.posts)) {
                    return data.posts;
                }
            } catch (err) {
                console.error('Ошибка загрузки постов:', err);
            }
            return [];
        },
        [wsClient]
    );

    useEffect(() => {
        if (!isSocketAuthorized) {
            setIsInitialLoading(false);
            return;
        }
        setIsInitialLoading(true);
        loadPosts({ type: postsCategory, startIndex: 0 })
            .then(fetched => {
                dispatch(clearCategory(postsCategory));
                dispatch(setCategoryPosts({ category: postsCategory, posts: fetched }));
            })
            .catch(err => {
                console.error('Ошибка initial load:', err);
            })
            .finally(() => {
                setIsInitialLoading(false);
            });
    }, [isSocketAuthorized, postsCategory, dispatch, loadPosts]);

    useEffect(() => {
        if (
            postsEndIsView &&
            !isInitialLoading &&
            !isMoreLoading &&
            hasMore &&
            isSocketAuthorized
        ) {
            setIsMoreLoading(true);
            const currentIndex = si;
            loadPosts({ type: postsCategory, startIndex: currentIndex })
                .then(fetched => {
                    if (fetched.length > 0) {
                        dispatch(appendCategoryPosts({ category: postsCategory, posts: fetched }));
                    }
                })
                .catch(err => {
                    console.error('Ошибка more load:', err);
                })
                .finally(() => {
                    setIsMoreLoading(false);
                });
        }
    }, [
        postsEndIsView,
        isInitialLoading,
        isMoreLoading,
        hasMore,
        si,
        postsCategory,
        isSocketAuthorized,
        dispatch,
        loadPosts,
    ]);

    const onSend = () => {
        selectPostsCategory('last');
        loadPosts({ type: postsCategory, startIndex: 0 })
            .then(fetched => {
                dispatch(clearCategory(postsCategory));
                dispatch(setCategoryPosts({ category: postsCategory, posts: fetched }));
            })
    };

    const selectPostsCategory = (category: 'last' | 'rec' | 'subscribe') => {
        if (postsCategory !== category) {
            setPostsCategory(category);
        }
    };

    return (
        <>
            <div className="UI-C_L">
                <div ref={postsRef} className="UI-ScrollView">
                    {
                        showOnlineUsers && <OnlineUsers />
                    }
                    <AddPost
                        onSend={onSend}
                        inputPlaceholder={t('post_text_input')}
                        className={(!showOnlineUsers ? 'UI-B_FIRST' : '')}
                    />
                    <div className="UI-Tabs">
                        <button
                            onClick={() => selectPostsCategory('last')}
                            className={classNames('Tab', { ActiveTab: postsCategory === 'last' })}
                        >
                            {t('category_last')}
                        </button>

                        <button
                            onClick={() => selectPostsCategory('rec')}
                            className={classNames('Tab', { ActiveTab: postsCategory === 'rec' })}
                        >
                            {t('category_recommended')}
                        </button>

                        <button
                            onClick={() => selectPostsCategory('subscribe')}
                            className={classNames('Tab', { ActiveTab: postsCategory === 'subscribe' })}
                        >
                            {t('category_subscriptions')}
                        </button>
                    </div>
                    <div className="Posts">
                        {!loaded ? (
                            <PreloadPosts />
                        ) : posts.length > 0 ? (
                            <>
                                {posts.map(post => (
                                    <Post key={`PID-${post.id}`} post={post} />
                                ))}
                                {hasMore && !isMoreLoading && <span ref={postsEndRef} />}
                                {isMoreLoading && (
                                    <div className="UI-Loading">
                                        <Ring
                                            size="30"
                                            stroke="3"
                                            bgOpacity="0"
                                            speed="2"
                                            color="var(--TEXT_COLOR)"
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="UI-ErrorMessage">{t('ups')}</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="UI-C_R">
                <div className="UI-ScrollView">
                    <Update />
                    <DefaultBanner />
                    <div className="UI-Block">
                        <div className="UI-Title">
                            {t('gold_users_list_1')}
                        </div>
                        <div className="GoldSub-Users">
                            <GoldUsers />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Home;
