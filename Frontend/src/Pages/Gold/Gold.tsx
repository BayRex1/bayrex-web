import { useState } from 'react';
import { Animate } from '../../System/Elements/Function';
import GoldUsers from '../../System/Elements/GoldUsers';
import { useModalsStore } from '../../Store/modalsStore';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../System/Context/WebSocket';
import { useAuth } from '../../System/Hooks/useAuth';
import { Block, Tabs } from '../../UIKit';

const Advantages = () => {
    const { t } = useTranslation();
    const [activeAdvantage, setActiveAdvantage] = useState('');

    const selectAdvantage = (advantage) => {
        setActiveAdvantage(advantage);
        if (advantage.video) {
            Animate('.GoldSub-VideoPreview', 'INFO_SUB-SHOW', 0.4);
            Animate('.GoldSub-VideoPreview video', 'INFO_SUB_VIDEO-SHOW', 0.4);
        }
        if (advantage.info) {
            Animate('.GoldSub-InfoPreview', 'INFO_SUB-SHOW', 0.4);
        }
    };

    const closeAdvantage = () => {
        Animate('.GoldSub-VideoPreview', 'INFO_SUB-HIDE', 0.4);
        Animate('.GoldSub-VideoPreview video', 'INFO_SUB_VIDEO-HIDE', 0.4);
    };

    return (
        <>
            <Block>
                <div className="GoldSub-Advantages">
                    {[
                        {
                            title: t('gold_ad_1'),
                            description: t('gold_ad_1_desc'),
                            info: true
                        },
                        {
                            title: t('gold_ad_2'),
                            description: t('gold_ad_2_desc'),
                            video: 'GoldSub_Icon',
                        },
                        {
                            title: t('gold_ad_3'),
                            description: t('gold_ad_3_desc'),
                            video: 'GoldSub_Ad',
                        },
                        {
                            title: t('gold_ad_4'),
                            description: t('gold_ad_4_desc'),
                            video: 'GoldSub_Theme',
                        },
                        {
                            title: t('gold_ad_5'),
                            description: t('gold_ad_5_desc'),
                            video: 'GoldSub_List',
                        },
                    ].map((advantage, i) => (
                        <div onClick={() => selectAdvantage(advantage)} key={i} className="GoldSub-A_Block">
                            <div className="GoldSub-A_B_TITLE">
                                {advantage.title}
                            </div>
                            <div>{advantage.description}</div>
                        </div>
                    ))}
                </div>
            </Block>
            <div className="GoldSub-Info_action">
                <div className="GoldSub-InfoPreview">
                    <div className="Info">
                        <div className="InfoTitle">{activeAdvantage.title}</div>
                        <div className="InfoDec">
                            <div className="Title">{t('gold_info_prev_1')}</div>
                            <div className="InfoContainer">
                                <div className="Default">4 MB</div>
                                <div className="Gold">8 MB</div>
                            </div>
                            <div className="Title">{t('gold_info_prev_2')}</div>
                            <div className="InfoContainer">
                                <div className="Default">20 MB</div>
                                <div className="Gold">50 MB</div>
                            </div>
                            <div className="Title">{t('gold_info_prev_3')}</div>
                            <div className="InfoContainer">
                                <div className="Default">10 MB</div>
                                <div className="Gold">30 MB</div>
                            </div>
                            <div className="Title">{t('gold_info_prev_4')}</div>
                            <div className="InfoContainer" style={{ marginBottom: '25px' }}>
                                <div className="Default">{t('no')}</div>
                                <div className="Gold">{t('yes')}</div>
                            </div>
                        </div>
                        <button className="Close" onClick={() => Animate('.GoldSub-InfoPreview', 'INFO_SUB-HIDE', 0.4)}>
                            {t('close')}
                        </button>
                    </div>
                </div>
                <div className="GoldSub-VideoPreview">
                    <video src={`/static_sys/Videos/${activeAdvantage.video}.mp4`} autoPlay muted loop></video>
                    <div className="Info">
                        <div className="InfoTitle">{activeAdvantage.title}</div>
                        <div className="InfoDec">{activeAdvantage.description}</div>
                        <button className="Close" onClick={closeAdvantage}>
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

const History = () => {
    const { t } = useTranslation();
    const { accountData } = useAuth();

    return (
        accountData.gold_history.length > 0 ?
            accountData.gold_history.map((block, i) => (
                <Block
                    key={i}
                    style={{
                        display: 'flex',
                        flexDirection: 'row'
                    }}
                >
                    <div className="Status">
                        {block.status === 1 ? 'Активна' : 'Неактивна'}
                    </div>
                    , активировано{' '}
                    {new Date(block.date).toLocaleDateString({
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                    })}
                </Block>
            )) : (
                <div className="UI-ErrorMessage">
                    {t('ups')}
                </div>
            )
    );
}

const Gold = () => {
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    const { openModal } = useModalsStore() as any;
    const { accountData } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    const handleAnswer = (data) => {
        if (data.status === 'success') {
            openModal({
                type: 'alert',
                props: {
                    title: 'Успешно',
                    message: 'Подписка активирована'
                }
            });
        } else {
            openModal({
                type: 'alert',
                props: {
                    title: 'Ошибка',
                    message: data.message || 'Точных причин нет'
                }
            });
        }
    }

    const pay = () => {
        wsClient.send({
            type:'social',
            action: 'gold_pay'
        }).then((data) => handleAnswer(data))
    };

    const activate = (code) => {
        wsClient.send({
            type: 'social',
            action: 'gold_activate',
            code: code
        }).then((data) => handleAnswer(data))
    }

    const openActivate = () => {
        openModal({
            type: 'input',
            props: {
                title: 'Введите ключ',
                message: 'Ключ можно получить разными способами. Начиная от покупки, заканчивая просто подарком от кого-то.',
                onConfirm: (inputValue) => {
                    activate(inputValue);
                }
            }
        });
    }

    const tabs = [
        {
            title: t('gold_advantage'),
            content: <Advantages />
        },
        {
            title: t('gold_history'),
            content: <History />
        }
    ]

    return (
        <>
            <div className="UI-C_L">
                <div className="UI-ScrollView">
                    <Block className="UI-B_FIRST">
                        <div className="UI-Title">{t('subscribe_gold')}</div>
                        <img className="GoldSub-Logo" src="/static_sys/Images/SubscriptionLogo.svg" alt="Gold Subscription Logo" />
                        {accountData.gold_status ? (
                            <div className="GoldSub-Price">{t('gold_payed')}</div>
                        ) : (
                            <div className="GoldSub-Price">{t('gold_price')}</div>
                        )}
                    </Block>
                    <Tabs
                        tabs={tabs}
                        select={setActiveTab}
                    />
                    {tabs[activeTab]?.content}
                    {!accountData.gold_status && (
                        <div className="GoldSub-Buttons">
                            <button onClick={pay} className="Pay">
                                {t('gold_pay')}
                                <div className="Eballs">
                                    <div className="UI-Eball">E</div>
                                    0.1
                                </div>
                            </button>
                            <button onClick={openActivate} className="Activate">
                                {t('activate')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="UI-C_R">
                <div className="UI-ScrollView">
                    <Block className="UI-B_FIRST">
                        <div className="UI-Title">
                            {t('gold_users_list_2')}
                        </div>
                        <div className="GoldSub-Users">
                            <GoldUsers />
                        </div>
                    </Block>
                </div>
            </div>
        </>
    );
};

export default Gold;
