import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router';
import { TopBar } from '../../Components/Navigate';
import ErrorPage from '../ErrorPage';
import { Window } from '../../System/Elements/Modal';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../System/Context/WebSocket';
import ChangeChannel from './Components/ChangeChannel';
import Header from './Components/Header';
import Info from './Components/Info';
import Posts from './Components/Posts';
import Wall from './Components/Wall';
import { useDispatch, useSelector } from 'react-redux';
import { addProfilePosts, setProfile, setProfilePosts, setProfilePostsLoaded } from '../../Store/Slices/profiles';
import { selectProfileByUsername, selectProfileMetaByUsername, selectProfilePosts } from '../../Store/Selectors/profilesSelectors';
import { addPosts } from '../../Store/Slices/posts';
import Gifts from './Components/Gifts';
import { Tabs } from '../../UIKit';
import './Profile.scss';
import useSettingsStore from '../../Store/settingsStore';
import { useAuth } from '../../System/Hooks/useAuth';

const Profile = () => {
    const { hideProfileAnimation } = useSettingsStore();
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    const { accountData } = useAuth();
    const params = useParams();
    const dispatch = useDispatch();
    const username: string | undefined = params.username;
    const postsRef = useRef<HTMLDivElement>(null);
    const selectProfileData = useMemo(() => (state) => selectProfileByUsername(state, username), [username]);
    const profileData = useSelector(selectProfileData);
    const selectPostsForProfile = useMemo(() => {
        if (profileData?.id == null || profileData?.type == null) {
            return () => [];
        }
        const id = profileData.id;
        const type = profileData.type;
        return (state) => selectProfilePosts(state, id, type);
    }, [profileData?.id, profileData?.type]);
    const posts = useSelector(selectPostsForProfile);
    const profileMeta: any = useSelector(state => selectProfileMetaByUsername(state, username));
    const isProfileLoaded = profileMeta?.loaded ?? false;
    const isPostsLoaded = profileMeta?.postsLoaded ?? false;

    const [profileHidden, setProfileHidden] = useState<boolean>(false);
    const [morePostsLoading, setMorePostsLoading] = useState<boolean>(false);
    const [allPostsLoaded, setAllPostsLoaded] = useState<boolean>(false);

    const [changeChannelOpen, setChangeChannelOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState(0);

    const { ref: postsEndRef, inView: postsEndIsView } = useInView({
        threshold: 0
    });

    const [profileError, setProfileError] = useState<boolean>(false);

    const loadProfile = (username) => {
        wsClient.send({
            type: 'social',
            action: 'get_profile',
            username: username
        }).then((res) => {
            if (res.status === 'success') {
                const uid = res.data.id;
                const type = res.data.type === 'user' ? 0 : 1;

                if (uid) {
                    dispatch(setProfile({
                        type: type,
                        profile: res.data
                    }))
                    if (res.data.posts > 0) {
                        wsClient.send({
                            type: 'social',
                            action: 'load_posts',
                            payload: {
                                posts_type: 'profile',
                                author_id: res.data.id,
                                author_type: type,
                                start_index: 0
                            }
                        }).then((res) => {
                            if (res.posts && res.posts.length > 0) {
                                dispatch(addPosts(res.posts));
                                dispatch(setProfilePosts({
                                    id: uid,
                                    type,
                                    posts: res.posts,
                                    start_index: res.posts.length
                                }));
                            }
                            dispatch(setProfilePostsLoaded({
                                id: uid,
                                type: type,
                                value: true
                            }))
                        })
                    } else {
                        dispatch(setProfilePostsLoaded({
                            id: uid,
                            type: type,
                            value: true
                        }))
                    }
                }
                setProfileError(false);
            } else {
                setProfileError(true);
            }
        })
    }

    const updateProfile = () => {
        loadProfile(params.username);
    }

    const onSend = () => {
        const type = profileData.type === 'user' ? 0 : 1;

        wsClient.send({
            type: 'social',
            action: 'load_posts',
            payload: {
                posts_type: 'profile',
                author_id: profileData.id,
                author_type: type,
                start_index: 0
            }
        }).then((res) => {
            if (res.posts && res.posts.length > 0) {
                dispatch(addPosts(res.posts));
                dispatch(setProfilePosts({
                    id: profileData.id,
                    type: type,
                    posts: res.posts,
                    start_index: res.posts.length
                }));
            }
            dispatch(setProfilePostsLoaded({
                id: profileData.id,
                type: type,
                value: true
            }))
        })
    }

    const tabs = [
        {
            title: t('profile_posts'),
            content: <Posts
                profileData={profileData}
                postsLoaded={isPostsLoaded}
                posts={posts}
                morePostsLoading={morePostsLoading}
                allPostsLoaded={allPostsLoaded}
                postsEndRef={postsEndRef}
                onSend={onSend}
            />
        },
        ...((profileData?.gifts_count > 0 && accountData?.id !== undefined)
            ? [{
                title: `${t('gifts.count')} (${profileData?.gifts_count})`,
                content: <Gifts profileData={profileData} />
            }]
            : []),
        ...(accountData?.id !== undefined
            ? [{
                title: `${t('profile_wall')}${profileData?.wall_count > 0 ? ` (${profileData?.wall_count})` : ''}`,
                content: <Wall profileData={profileData} />
            }]
            : []),
        {
            title: t('profile_info'),
            content: <Info profileData={profileData} />
        }
    ]

    useEffect(() => {
        setProfileError(false);
        loadProfile(username);
        setAllPostsLoaded(false);
        setMorePostsLoading(false);
    }, [username])

    useEffect(() => {
        if (!hideProfileAnimation) return;
        
        const handleScroll = () => {
            if (postsRef.current && postsRef.current.scrollTop > 250) {
                setProfileHidden(true);
            } else {
                setProfileHidden(false);
            }
        };
        const element = postsRef.current;
        if (element) {
            element.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (element) {
                element.removeEventListener('scroll', handleScroll);
            }
        };
    }, [])

    useEffect(() => {
        if (postsEndIsView && profileMeta.loaded) {
            setMorePostsLoading(true);
            const type = profileData.type === 'user' ? 0 : 1;

            wsClient.send({
                type: 'social',
                action: 'load_posts',
                payload: {
                    posts_type: 'profile',
                    author_id: profileData.id,
                    author_type: type,
                    start_index: profileMeta.start_index
                }
            }).then((res) => {
                if (res.posts && res.posts.length > 0) {
                    dispatch(addPosts(res.posts));
                    dispatch(addProfilePosts({
                        id: profileData.id,
                        type,
                        posts: res.posts
                    }));
                } else {
                    setAllPostsLoaded(true);
                }
                setMorePostsLoading(false);
            })
        }
    }, [postsEndIsView]);

    return (
        <>
            <TopBar search={true} />
            <div className="Content Profile-Page">
                {
                    (profileError || (isProfileLoaded && !profileData?.id)) ? (
                        <ErrorPage />
                    ) : (
                        <>
                            <Header
                                profileData={profileData}
                                profileLoaded={isProfileLoaded}
                                profileHidden={profileHidden}
                                setChangeChannelOpen={setChangeChannelOpen}
                            />
                            <div className="UI-C_R Profile-Posts">
                                <div ref={postsRef} className="UI-ScrollView">
                                    <div className="Posts" style={{ marginBottom: 20 }}>
                                        <Tabs
                                            tabs={tabs}
                                            select={setActiveTab}
                                            className="UI-B_FIRST UI-Block"
                                        />
                                        {tabs[activeTab]?.content}
                                    </div>
                                </div>
                            </div>
                            <Window
                                title="Изменить канал"
                                content={
                                    <ChangeChannel
                                        profileData={profileData}
                                        updateData={updateProfile}
                                    />
                                }
                                contentClass="MultiForm"
                                style={{ width: 'fit-content' }}
                                isOpen={changeChannelOpen}
                                setOpen={setChangeChannelOpen}
                            />
                        </>
                    )
                }
            </div>
        </>
    )
};

export default Profile;
