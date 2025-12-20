import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalsStore } from '../../Store/modalsStore';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { I_DELETE } from '../../System/UI/IconPack';
import { NavButton } from '.';
import { useAuth } from '../../System/Hooks/useAuth';
import { useWebSocket } from '../../System/Context/WebSocket';
import { Avatar } from '../../UIKit';

const NavPanel = () => {
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    const { openModal } = useModalsStore() as any
    const { accountData, accounts, switchAccount, deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [menu, setMenu] = useState('main');

    const handleDeleteAccount = (id: number, S_KEY: string) => {
        openModal({
            type: 'query',
            props: {
                title: t('are_you_sure'),
                message: t('remove_account_warning'),
                onConfirm: () => {
                    wsClient.send({
                        type: 'authorization',
                        action: 'logout',
                        S_KEY: S_KEY
                    })
                    deleteAccount(id);
                }
            }
        });
    }

    const handleExit = () => {
        wsClient.send({
            type: 'authorization',
            action: 'logout',
            S_KEY: accountData.S_KEY
        })
        deleteAccount(accountData.id);
        localStorage.removeItem('S_KEY');
        navigate('/auth');
    };

    const variants = {
        hidden: { opacity: 0, x: 40 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
    };

    return (
        <motion.div
            layout
            transition={{
                layout: { duration: 0.2 }
            }}
            className="UI-NavPanel"
        >
            <AnimatePresence mode="wait">
                {menu === 'main' && (
                    <motion.div
                        key="main"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="Layer"
                    >
                        <NavButton to={`/e/${accountData?.username}`}>
                            {t('my_profile')}
                        </NavButton>
                        <button onClick={() => setMenu('accounts')}>
                            {t('change_account')}
                        </button>
                        <button onClick={handleExit}>{t('exit')}</button>
                    </motion.div>
                )}

                {menu === 'accounts' && (
                    <motion.div
                        key="accounts"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="Layer"
                    >
                        {accounts.map((account: any, i: number) => (
                            <div key={i} className="AccountContainer">
                                <button className="Account" onClick={() => { switchAccount(account.id) }}>
                                    <Avatar
                                        avatar={account.avatar}
                                        name={account.username}
                                        size={35}
                                    />
                                    <div className="Name">
                                        {account.name}
                                    </div>
                                </button>
                                <button
                                    onClick={() => { handleDeleteAccount(account.id, account.S_KEY) }}
                                    className="Delete"
                                >
                                    <I_DELETE />
                                </button>
                            </div>
                        ))}
                        <NavButton to="/auth">
                            {t('add')}
                        </NavButton>
                        <button onClick={() => setMenu('main')}>
                            {t('back')}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default NavPanel;
