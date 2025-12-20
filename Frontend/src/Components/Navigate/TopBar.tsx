import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Animate } from '../../System/Elements/Function';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import MiniPlayer from './MiniPlayer';
import { I_MUSIC } from '../../System/UI/IconPack';
import SearchResult from './SearchResult';
import NavPanel from './NavPanel';
import MobileSidebar from './MobileSidebar';
import { Avatar, TextInput } from '../../UIKit';
import { useAuth } from '../../System/Hooks/useAuth';

interface TopBarProps {
    title?: boolean;
    search?: boolean;
    titleText?: string;
    className?: string;
}

const TopBar: React.FC<TopBarProps> = ({ title, search, titleText }) => {
    const { t } = useTranslation();
    const { accountData } = useAuth();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth <= 768);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
    const [notificationsVisible, setNotificationsVisible] = useState<boolean>(false);
    const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);

    const panelHidden = useSelector((state: any) => state.ui.topPanelHidden);
    const playerState = useSelector((state: any) => state.musicPlayer);

    const [searchValue, setSearchValue] = useState<string>('');
    const [isNavPanelOpen, setIsNavPanelOpen] = useState(false);
    const [mode, setMode] = useState<number>(0);

    const navPanelRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);

    const variants = useMemo(() => ({
        hidden: { opacity: 0, scale: 0.5 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.5 }
    }), []);

    const navPanelVariants = {
        hidden: {
            opacity: 0,
            scale: 0.3,
            x: 25,
            y: -100,
            rotateX: 10,
            rotateY: -10,
            rotateZ: 1,
            transition: {
                duration: 0.3,
                ease: 'easeInOut'
            }
        },
        visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            transition: {
                duration: 0.3,
                ease: 'easeInOut'
            }
        },
        exit: {
            opacity: 0,
            scale: 0.3,
            x: 25,
            y: -100,
            rotateX: 10,
            rotateY: -10,
            rotateZ: 1,
            transition: {
                duration: 0.3,
                ease: 'easeInOut'
            }
        }
    };

    useEffect(() => {
        const checkIfMobile = () => {
            const isMobileNow = window.innerWidth <= 768;
            setIsMobile(isMobileNow);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const toggleNavPanel = () => {
        if (isMobile) {
            setMobileSidebarOpen(true);
            if (notificationsVisible) setNotificationsVisible(false);
            return;
        }

        if (isNavPanelOpen) {
            closePanel();
        } else {
            openPanel();
        }
    };

    const openPanel = () => {
        Animate('.UI-NavPanel', 'NAV_PANEL_BUTTONS-SHOW', 0.3);
        setIsNavPanelOpen(true);
    };

    const closePanel = () => {
        Animate('.UI-NavPanel', 'NAV_PANEL_BUTTONS-HIDE', 0.3);
        setIsNavPanelOpen(false);
    };

    const closeMobileSidebar = () => {
        setMobileSidebarOpen(false);
    };

    const goToBalance = useCallback(() => {
        navigate('/wallet');
    }, [navigate]);

    useEffect(() => {
        const updateNavPanelPosition = () => {
            if (!isNavPanelOpen || !navPanelRef.current || !avatarRef.current) return;

            const avatarRect = avatarRef.current.getBoundingClientRect();
            const navPanel = navPanelRef.current;

            const top = avatarRect.bottom + window.scrollY;
            const left = avatarRect.left + window.scrollX;

            navPanel.style.position = 'absolute';
            navPanel.style.top = `${top + 18}px`;
            navPanel.style.left = `${left + 45}px`;
            navPanel.style.zIndex = '30';
        };

        updateNavPanelPosition();

        window.addEventListener('resize', updateNavPanelPosition);
        window.addEventListener('scroll', updateNavPanelPosition, true);

        return () => {
            window.removeEventListener('resize', updateNavPanelPosition);
            window.removeEventListener('scroll', updateNavPanelPosition, true);
        };
    }, [isNavPanelOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!isNavPanelOpen && !notificationsVisible) return;
            const target = event.target as Element;
            if (
                !target.closest('.UI-NavPanel') &&
                !target.closest('.AvatarContainer') &&
                !(avatarRef.current && avatarRef.current.contains(target))
            ) {
                isNavPanelOpen && closePanel();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNavPanelOpen, notificationsVisible]);

    return (
        <AnimatePresence>
            {!panelHidden && (
                <>
                    <motion.header initial={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -100 }}>
                        <div className="UI-N_DIV">
                            {accountData?.id ? (
                                <>
                                    {!(mode === 1 && isMobile) && (
                                        <>
                                            {title ? (
                                                <div className="UI-N_L_AND_N">
                                                    <NavLink className="UI-Logo" to="/" />
                                                    <div>{titleText}</div>
                                                </div>
                                            ) : (
                                                <NavLink className="UI-Logo" to="/" />
                                            )}

                                        </>
                                    )
                                    }
                                    <AnimatePresence>
                                        {
                                            mode === 0 ? (
                                                <motion.div
                                                    className="Search-Container"
                                                    initial={shouldAnimate ? "hidden" : false}
                                                    animate="visible"
                                                    exit="exit"
                                                    variants={variants}
                                                >
                                                    {search && (
                                                        <TextInput
                                                            className="Search"
                                                            placeholder={t('search')}
                                                            value={searchValue}
                                                            onChange={(e) => { setSearchValue(e.target.value) }}
                                                            type="text"
                                                            transparent={true}
                                                        />
                                                    )}
                                                    <div className="EBalls" onClick={goToBalance} style={{ cursor: 'pointer' }}>
                                                        <div className="UI-Eball">E</div>
                                                        <div className="Count">
                                                            {typeof accountData?.e_balls === 'number'
                                                                ? accountData.e_balls.toFixed(3)
                                                                : Number(accountData?.e_balls || 0).toFixed(3)}
                                                        </div>
                                                    </div>
                                                    {
                                                        playerState.selected && (
                                                            <button className="SwitchButton" onClick={() => { setMode(1); setShouldAnimate(true); }}>
                                                                <I_MUSIC />
                                                            </button>
                                                        )
                                                    }
                                                </motion.div>
                                            ) : (
                                                <MiniPlayer setMode={setMode} variants={variants} />
                                            )
                                        }
                                    </AnimatePresence>
                                    {
                                        !(mode === 1 && isMobile) && (
                                            <div className="AvatarContainer" ref={avatarRef}>
                                                <Avatar
                                                    avatar={accountData.avatar}
                                                    name={accountData.name}
                                                    size={40}
                                                    onClick={toggleNavPanel}
                                                />
                                            </div>
                                        )
                                    }
                                </>
                            ) : (
                                <div className="UI-N_L_AND_N">
                                    <NavLink className="UI-Logo" to="/auth" />
                                    <span>Element</span>
                                </div>
                            )}
                        </div>
                    </motion.header>

                    {!isMobile && <div ref={navPanelRef}><NavPanel /></div>}

                    <SearchResult searchValue={searchValue} />

                    {isMobile && (
                        <MobileSidebar
                            isOpen={mobileSidebarOpen}
                            onClose={closeMobileSidebar}
                        />
                    )}
                </>
            )}
        </AnimatePresence>
    );
};

export default TopBar;
