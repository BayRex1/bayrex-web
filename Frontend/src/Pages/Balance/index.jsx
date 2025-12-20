import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../System/Hooks/useAuth';
import { useWebSocket } from '../../System/Context/WebSocket';
import {
    I_TRANSFER
} from '../../System/UI/IconPack';
import EarnInfo from './Components/EarnInfo';
import TransactionHistory from './Components/TransactionHistory';
import './Balance.scss';
import { useModalsStore } from '../../Store/modalsStore';
import Transfer from './Modals/Transfer';
import { Block, Button, Tabs } from '../../UIKit';

const SubscriptionHistory = ({ history }) => {
    const { t } = useTranslation();

    return history.length > 0 ? (
        history.map((block, i) => (
            <div key={i} className="Status-Block">
                <div className={`Status ${block.status === 1 ? 'Active' : ''}`}>
                    {block.status === 1 ? t('balance.subscription.status.active') : t('balance.subscription.status.inactive')}
                </div>
                , {t('balance.subscription.activated_on', { date: new Date(block.date).toLocaleDateString('ru-RU') })}
            </div>
        ))
    ) : (
        <div className="UI-ErrorMessage">
            {t('ups')}
        </div>
    );
};

const Balance = () => {
    const { t } = useTranslation();
    const { accountData } = useAuth();
    const { wsClient } = useWebSocket();
    const [activeTab, setActiveTab] = useState(0);
    const { openModal } = useModalsStore();

    const openTransfer = () => {
        openModal({
            type: 'routed',
            props: {
                title: t('balance.transfer'),
                children: <Transfer />
            }
        });
    }

    const handleAnswer = (data) => {
        if (data.status === 'success') {
            openModal({
                type: 'info',
                props: {
                    title: t('success'),
                    text: t('balance.subscription.success')
                }
            });
        } else {
            openModal({
                type: 'info',
                props: {
                    title: t('error'),
                    text: data.message || t('balance.subscription.error_unknown')
                }
            });
        }
    };

    const pay = () => {
        wsClient.send({
            type: 'social',
            action: 'gold_pay'
        }).then((data) => handleAnswer(data));
    };

    const activate = (code) => {
        wsClient.send({
            type: 'social',
            action: 'gold_activate',
            code: code
        }).then((data) => handleAnswer(data));
    };

    const openActivate = () => {
        openModal({
            type: 'input',
            props: {
                title: t('balance.subscription.activate.title'),
                text: t('balance.subscription.activate.description'),
                onNext: (inputValue) => {
                    activate(inputValue);
                }
            }
        });
    };

    const tabs = [
        {
            title: t('balance.tabs.history'),
            content: <TransactionHistory />
        },
        {
            title: t('balance.tabs.subscription'),
            content: (
                <>
                    {!accountData.gold_status && (
                        <div className="Subscription-Block">
                            <img
                                className="GoldSub-Logo"
                                alt="Gold Subscription Logo"
                                src="/static_sys/Images/SubscriptionLogo.svg"
                                draggable={false}
                            />
                            <div className="GoldSub-Price">
                                {t('gold_price')}
                            </div>
                            <div className="Actions">
                                <Button
                                    title={t('activate')}
                                    onClick={openActivate}
                                />
                                <Button
                                    title={t('pay')}
                                    onClick={pay}
                                    buttonStyle="action"
                                />
                            </div>
                        </div>
                    )}
                    <SubscriptionHistory history={accountData.gold_history || []} />
                </>
            )
        },
        {
            title: t('balance.tabs.earning'),
            content: <EarnInfo />
        }
    ];

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (
        <>
            <div className="UI-ScrollView Content-Center">
                <div className="UI-C_M">
                    <Block className="Balance-Card UI-B_FIRST">
                        <div className="Balance-Title">{t('balance.current')}</div>
                        <div className="Balance-Amount">
                            <div className="UI-Eball">E</div>
                            <div className="Count">
                                {typeof accountData?.e_balls === 'number'
                                    ? accountData.e_balls.toFixed(3)
                                    : Number(accountData?.e_balls || 0).toFixed(3)}
                            </div>
                        </div>

                        <div className="Balance-Actions">
                            {/* <button className="Action-Button" disabled>
                                <I_PAYMENT />
                                <span>{t('balance.actions.pay')}</span>
                            </button>
                            <button className="Action-Button" disabled>
                                <I_ADD />
                                <span>{t('balance.actions.add')}</span>
                            </button> */}
                            <button className="Action-Button" onClick={openTransfer}>
                                <I_TRANSFER />
                                <span>{t('balance.actions.transfer')}</span>
                            </button>
                        </div>
                    </Block>

                    {/* <div className="UI-Block Forecast-Block">
                        <div className="UI-BLOCK_HEADER">
                            <div className="UI-Block-Title">
                                <I_CHART />
                                {t('balance.forecast.title')}
                            </div>
                        </div>

                        <div className="UI-BLOCK_CONTENT">
                            <div className="Forecast-Date">
                                {t('balance.forecast.date_range', {
                                    startDate: today.toLocaleDateString('ru-RU'),
                                    endDate: tomorrow.toLocaleDateString('ru-RU')
                                })}
                            </div>
                            <div className="Forecast-Amount">
                                <div className="Count">
                                    +0.390
                                </div>
                                <div className="UI-Eball">Е</div>
                            </div>
                            <div className="Forecast-Description">
                                {t('balance.forecast.description')}
                            </div>
                        </div>
                    </div> */}

                    <Block>
                        <Tabs
                            tabs={tabs}
                            select={setActiveTab}
                        />
                        {tabs[activeTab].content}
                    </Block>
                </div>
            </div>
        </>
    );
};

export default Balance;
