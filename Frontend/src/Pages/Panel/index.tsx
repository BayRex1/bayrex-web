import { Navigate, Route, Routes } from 'react-router-dom';
import { LeftNavButton, TopBar } from '../../Components/Navigate';
import { I_BACK, I_GIFT, I_GOLD_STAR, I_PANEL, I_USERS, I_WARNING } from '../../System/UI/IconPack';
import Statistic from './Pages/Statistic';
import Users from './Pages/Users';
import Gold from './Pages/Gold';
import Gifts from './Pages/Gifts';
import Moderation from './Pages/Moderation';
import './Panel.scss';
import { useTranslation } from 'react-i18next';

const Panel = () => {
    const { t } = useTranslation();

    const navItems = [
        {
            path: 'stat',
            name: t('statistics'),
            icon: <I_PANEL />,
        },
        {
            path: 'users',
            name: t('users'),
            icon: <I_USERS />,
        },
        {
            path: 'gold',
            name: t('subscribe_gold'),
            icon: <I_GOLD_STAR />,
        },
        {
            path: 'gifts',
            name: t('gifts.title'),
            icon: <I_GIFT />,
        },
        {
            path: 'moderation',
            name: 'Модерация',
            icon: <I_WARNING />,
        },
        {
            path: '/',
            name: t('exit'),
            icon: <I_BACK />,
        },
    ];

    return (
        <>
            <TopBar title={true} titleText="Панель управления" />
            <div className="Content">
                <div className="UI-L_NAV UI-B_FIRST">
                    {navItems.map((item, i) => (
                        <LeftNavButton key={i} currentPage="panel" target={item.path}>
                            <div className="UI-LN_ICON">{item.icon}</div>
                            {item.name}
                        </LeftNavButton>
                    ))}
                </div>

                <div className="UI-PAGE_BODY">
                    <div className="UI-ScrollView">
                        <Routes>
                            <Route path="stat" element={<Statistic />} />
                            <Route path="users" element={<Users />} />
                            <Route path="gold" element={<Gold />} />
                            <Route path="gifts" element={<Gifts />} />
                            <Route path="moderation" element={<Moderation />} />
                            <Route path="/" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Panel;
