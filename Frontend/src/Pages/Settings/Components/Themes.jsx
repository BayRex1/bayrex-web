import { HandleTheme } from '../../../System/Elements/Handlers';
import { useAuth } from '../../../System/Hooks/useAuth';
import useSettingsStore from '../../../Store/settingsStore';
import { useRef } from 'react';
import { isDesktop } from 'react-device-detect';

const Themes = () => {
    const { accountData } = useAuth();
    const { theme, setTheme } = useSettingsStore();
    const scrollRef = useRef(null);

    let themes = [
        {
            name: 'Светлая',
            id: 'LIGHT',
            class: 'Theme-Light',
            goldStatus: false,
        },
        {
            name: 'Золотая',
            id: 'GOLD',
            class: 'Theme-Gold',
            goldStatus: true,
        },
        {
            name: 'Тёмная',
            id: 'DARK',
            class: 'Theme-Dark',
            goldStatus: false,
        },
        {
            name: 'Золотая тёмная',
            id: 'GOLD-DARK',
            class: 'Theme-Gold-Dark',
            goldStatus: true,
        },
        {
            name: 'AMOLED',
            id: 'AMOLED',
            class: 'Theme-Amoled',
            goldStatus: false,
        },
        {
            name: 'Золотая AMOLED',
            id: 'AMOLED-GOLD',
            class: 'Theme-Amoled-Gold',
            goldStatus: true,
        },
        {
            name: 'Золотая AMOLED (Жидкое стекло)',
            id: 'AMOLED-GOLD-LG',
            class: 'Theme-Amoled-Gold-LG',
            goldStatus: true,
        },
        {
            name: 'Светлая (Жидкое стекло)',
            id: 'LIGHT-LG',
            class: 'Theme-Light_LG',
            goldStatus: false,
        },
        {
            name: 'Золотая (Жидкое стекло)',
            id: 'GOLD-LG',
            class: 'Theme-Gold_LG',
            goldStatus: true,
        },
        {
            name: 'Тёмная (Жидкое стекло)',
            id: 'DARK-LG',
            class: 'Theme-Dark-LG',
            goldStatus: false,
        },
        {
            name: 'Золотая тёмная (Жидкое стекло)',
            id: 'GOLD-DARK-LG',
            class: 'Theme-Gold-Dark_LG',
            goldStatus: true,
        },
        {
            name: 'AMOLED (Жидкое стекло)',
            id: 'AMOLED-LG',
            class: 'Theme-Amoled-LG',
            goldStatus: false,
        },
    ];

    themes = accountData.gold_status ? themes : themes.filter((t) => t.goldStatus === false);

    const onSetTheme = (themeId) => {
        setTheme(themeId);
        HandleTheme();
    };

    const scrollLeft = () => {
        if (scrollRef.current && scrollRef.current.scrollBy) {
            scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current && scrollRef.current.scrollBy) {
            scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    return (
        <>
            {
                isDesktop && (
                    <button className="ThemeScrollButton left" onClick={scrollLeft}>
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )
            }
            <div className="Scroll" ref={scrollRef} style={{ paddingLeft: isDesktop ? 50 : 8, paddingRight: isDesktop ? 50 : 8 }}>
                {themes.map((themeItem, i) => (
                    <div key={i} className={`${themeItem.class} ChangeTheme ${theme === themeItem.id ? 'Selected' : ''}`} onClick={() => onSetTheme(themeItem.id)}>
                        <div className="TH-Container">
                            <div className="TH-TopBar"></div>
                            <div className="TH-Posts">
                                <div className="TH-AddPost"><div className="TH-Button"></div></div>
                                <div className="TH-Post"></div>
                                <div className="TH-Post"></div>
                            </div>
                            <div className="TH-BottomBar"></div>
                        </div>
                        <div className="Info">{themeItem.name}</div>
                    </div>
                ))}
            </div>
            {
                isDesktop && (
                    <button className="ThemeScrollButton right" onClick={scrollRight}>
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                )
            }
        </>
    )
}

export default Themes;
