import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HandleLinkIcon, HandleUserBlock, HandleText, HandleUserIcons } from '../../../System/Elements/Handlers';
import { I_BLOCK, I_DOTS, I_EDIT, I_GIFT, I_MEGAPHONE, I_MESSENGER, I_REPORT } from '../../../System/UI/IconPack';
import { useTranslation } from 'react-i18next';
import { NavButton } from '../../../Components/Navigate';
import { useImageView } from '../../../System/Hooks/useImageView';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useAuth } from '../../../System/Hooks/useAuth';
import { Avatar, Cover, GovernButtons } from '../../../UIKit';
import { useModalsStore } from '../../../Store/modalsStore';
import SendGift from '../Modals/SendGift';
import ReportModal from '../../../Components/Modals/ReportModal';

const SubWrapper = ({ users }) => {
    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {
                users.map((user, i) => (
                    <HandleUserBlock
                        key={i}
                        user={user}
                        className="UI-Block"
                    />
                ))
            }
        </div>
    )
}

const Header = ({ profileData, profileLoaded, profileHidden, setChangeChannelOpen }) => {
    const { t } = useTranslation();
    const { accountData } = useAuth();
    const { openImage } = useImageView();
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();
    const [subscribed, setSubscribed] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [governIsOpen, setGovernorIsOpen] = useState(false);

    const changeChannel = () => {
        setChangeChannelOpen(true);
    }

    const blockProfile = () => {
        wsClient.send({
            type: 'social',
            action: 'block_profile',
            username: profileData.username
        })
        setIsBlocked(true);
    }

    const unblockProfile = () => {
        wsClient.send({
            type: 'social',
            action: 'unblock_profile',
            username: profileData.username
        })
        setIsBlocked(false);
    }

    const sendGift = () => {
        openModal({
            type: 'routed',
            props: {
                children: (
                    <SendGift
                        profileData={profileData}
                    />
                )
            }
        })
    }

    const profileGovern = [
        {
            title: t('send_gift'),
            icon: <I_GIFT />,
            onClick: sendGift
        },
        ...(!profileData?.my_profile
            ? [{
                title: t('block'),
                icon: <I_BLOCK />,
                onClick: () => {
                    blockProfile();
                    setGovernorIsOpen(false);
                }
            },
            {
                title: t('report'),
                icon: <I_REPORT />,
                onClick: () => {
                    openModal({
                        type: 'routed',
                        props: {
                            title: 'Жалоба на профиль',
                            children: <ReportModal
                                targetType={profileData.type}
                                targetId={profileData.id}
                                target={profileData}
                                onClose={() => openModal({ type: 'close' })}
                            />
                        }
                    });
                    setGovernorIsOpen(false);
                }
            }
            ]
            : []),
        ...(profileData?.type === 'channel' && profileData?.my_profile
            ? [{
                title: t('change'),
                icon: <I_EDIT />,
                onClick: changeChannel
            }]
            : [])
    ];

    const variants = {
        initial: {
            opacity: 0,
            marginLeft: '-40%'
        },
        animate: {
            opacity: 1,
            marginLeft: 0
        },
        exit: {
            opacity: 0,
            marginLeft: '-40%'
        },
    }

    useEffect(() => {
        if (profileLoaded) {
            setIsBlocked(profileData.blocked);
            setSubscribed(profileData.subscribed);
        }
    }, [profileLoaded])

    const viewSubscribed = () => {
        if (profileData.subscriptions > 0) {
            wsClient.send({
                type: 'social',
                action: 'profile/load_subscriptions',
                payload: {
                    username: profileData.username
                }
            }).then((res) => {
                if (res.status === 'success') {
                    openModal({
                        type: 'routed',
                        props: {
                            title: t('subscriptions'),
                            children: (
                                <SubWrapper users={res.users} />
                            )
                        }
                    })
                }
            })
        }
    }

    const viewSubscribes = () => {
        if (profileData.subscribers > 0) {
            wsClient.send({
                type: 'social',
                action: 'profile/load_subscribers',
                payload: {
                    username: profileData.username
                }
            }).then((res) => {
                if (res.status === 'success') {
                    openModal({
                        type: 'routed',
                        props: {
                            title: t('subscribers'),
                            children: (
                                <SubWrapper users={res.users} />
                            )
                        }
                    })
                }
            })
        }
    }

    const toggleSubscribe = () => {
        wsClient.send({
            type: 'social',
            action: 'profile/subscribe',
            payload: {
                username: profileData.username
            }
        })
        setSubscribed(!subscribed);
    }

    const viewCover = () => {
        openImage({
            neo_file: profileData.cover,
            metadata: {
                file_name: profileData.cover.file
            }
        })
    }

    const viewAvatar = () => {
        openImage({
            neo_file: profileData.avatar,
            metadata: {
                file_name: profileData.avatar.file
            }
        })
    }

    return (
        <AnimatePresence>
            {
                !profileHidden && (
                    <motion.div
                        className="UI-C_L"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={variants}
                    >
                        <div className="UI-ScrollView">
                            <div className="UI-Block Profile-InfoBlock UI-B_FIRST">
                                <Cover
                                    cover={profileData?.cover}
                                    style={{ opacity: !profileData?.cover ? '0' : '', height: !profileData?.cover ? '80px' : '' }}
                                    onClick={viewCover}
                                    isLoaded={profileLoaded}
                                    loading={true}
                                />
                                <div style={{ top: !profileData?.cover ? '28px' : '' }} className="AvatarContainer">
                                    <Avatar
                                        avatar={profileData?.avatar}
                                        name={profileData?.name}
                                        size={100}
                                        onClick={viewAvatar}
                                        loading={true}
                                        isLoaded={profileLoaded}
                                    />
                                    {
                                        (profileLoaded && profileData?.online) && (
                                            <div className="UI-Online"></div>
                                        )
                                    }
                                </div>

                                <div className="UI-NameBody">
                                    <div className="Name">
                                        {profileLoaded ? (
                                            profileData.name
                                        ) : (
                                            <div className="UI-PRELOAD" style={{ width: '100px', height: '15px' }}></div>
                                        )}
                                    </div>
                                    {
                                        profileLoaded && (
                                            profileData.type === 'channel' ? (
                                                <div className="UI-UserIcons"><I_MEGAPHONE /></div>
                                            ) : (
                                                <HandleUserIcons icons={profileData.icons} />
                                            )
                                        )
                                    }
                                </div>
                                <div className="Username">{profileLoaded ? '@' + profileData.username : <div className="UI-PRELOAD" style={{ width: '120px', height: '15px' }}></div>}</div>

                                {profileLoaded && (
                                    <div style={{ position: 'relative' }}>
                                        <div className="ButtonsContainer">
                                            <div className="Buttons">
                                                {
                                                    isBlocked ? (
                                                        <button onClick={unblockProfile} className="Button">{t('unblock')}</button>
                                                    ) : (
                                                        <>
                                                            {
                                                                (profileData?.type === 'user'
                                                                    ? accountData?.id !== profileData?.id
                                                                    : true) && (
                                                                    profileData.type === 'user' && (
                                                                        <NavButton to={`/chat/t0i${profileData.id}`} className="Button"><I_MESSENGER /></NavButton>
                                                                    ),
                                                                    subscribed ? (
                                                                        <button onClick={toggleSubscribe} className="Button">{t('unsubscribe_button')}</button>
                                                                    ) : (
                                                                        <button onClick={toggleSubscribe} className="SubButton Button">{t('subscribe_button')}</button>
                                                                    )
                                                                )
                                                            }
                                                            <button onClick={() => setGovernorIsOpen(!governIsOpen)} className="Button">
                                                                <I_DOTS />
                                                            </button>
                                                        </>
                                                    )
                                                }
                                            </div>
                                            <GovernButtons
                                                isOpen={governIsOpen}
                                                setIsOpen={setGovernorIsOpen}
                                                buttons={profileGovern}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="Info">
                                    {
                                        (profileLoaded && profileData.type !== 'channel') && (
                                            <button onClick={viewSubscribed} className="Container">
                                                <div className="Value">{profileLoaded ? profileData.subscriptions : <div className="UI-PRELOAD" style={{ width: '40px', height: '15px' }}></div>}</div>
                                                <div className="Title">{t('profile_subscriptions_count')}</div>
                                            </button>
                                        )
                                    }
                                    <button onClick={viewSubscribes} className="Container">
                                        <div className="Value">{profileLoaded ? profileData.subscribers : <div className="UI-PRELOAD" style={{ width: '40px', height: '15px' }}></div>}</div>
                                        <div className="Title">{t('profile_subscribers_count')}</div>
                                    </button>
                                    <div className="Container">
                                        <div className="Value">{profileLoaded ? profileData.posts : <div className="UI-PRELOAD" style={{ width: '40px', height: '15px' }}></div>}</div>
                                        <div className="Title">{t('profile_posts_count')}</div>
                                    </div>
                                </div>
                                {(profileLoaded && profileData.description) &&
                                    <div className="UI-Description">
                                        <div className="Title">{t('description')}</div>
                                        <div className="Text">
                                            <HandleText text={profileData.description} />
                                        </div>
                                    </div>
                                }
                                {(profileLoaded && profileData.links && profileData.links.length) > 0 &&
                                    <div className="UI-Links">
                                        {profileData.links.map((link, i) => (
                                            <button key={i} onClick={() => window.open(link.link, '_blank')} className="Link">
                                                <HandleLinkIcon link={link.link} /> {link.title}
                                            </button>
                                        ))}
                                    </div>
                                }
                            </div>
                        </div>
                    </motion.div>
                )
            }
        </AnimatePresence>
    )
}

export default Header;
