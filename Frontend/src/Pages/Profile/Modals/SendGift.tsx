import { useEffect, useState } from 'react';
import { Avatar, Gift } from '../../../UIKit';
import { I_GIFT } from '../../../System/UI/IconPack';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { LineSpinner } from 'ldrs/react';
import { useModalsStore } from '../../../Store/modalsStore';
import { useAuth } from '../../../System/Hooks/useAuth';

const SendGift = ({ profileData }) => {
    const { accountData, updateAccount } = useAuth();
    const { openModal } = useModalsStore();
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const [stars, setStars] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const [gifts, setGifts] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const id = Math.random().toString(36).slice(2, 9);
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * 100 + 50;

            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            const delay = Math.random() * 0.3;
            const size = Math.random() * 10 + 10;

            setStars((prev) => [
                ...prev,
                { id, offsetX, offsetY, delay, size }
            ]);

            setTimeout(() => {
                setStars((prev) => prev.filter((s) => s.id !== id));
            }, 2000);
        }, 150);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        wsClient.send({
            type: 'social',
            action: 'gifts/load'
        }).then((res) => {
            if (res.status === 'success') {
                setGifts(res.gifts)
                setLoading(false);
            }
        })
    }, []);

    const pay = (gift) => {
        openModal({
            type: 'query',
            props: {
                title: 'Точно купить?',
                message: `Вы точно хотите купить подарок «${gift.name}» для ${profileData.name}?`,
                onConfirm: () => {
                    wsClient.send({
                        type: 'social',
                        action: 'gifts/send',
                        payload: {
                            username: profileData.username,
                            gift_id: gift.id
                        }
                    }).then((res) => {
                        if (res.status === 'success') {
                            updateAccount({
                                e_balls: accountData.e_balls - gift.price
                            })
                            openModal({
                                type: 'alert',
                                props: {
                                    title: t('success'),
                                    message: 'Подарок отправлен!'
                                }
                            });
                        } else {
                            openModal({
                                type: 'alert',
                                props: {
                                    title: t('error'),
                                    message: res.message
                                }
                            });
                        }
                    })
                }
            }
        })
    }

    return (
        <div className='SendGift'>
            <div className='Header' style={{ position: 'relative' }}>
                <Avatar
                    avatar={profileData.avatar}
                    name={profileData.name}
                    size={60}
                />
                {stars.map(({ id, offsetX, offsetY, delay, size }) => (
                    <I_GIFT
                        key={id}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: size,
                            height: size,
                            transform: 'translate(-50%, -50%)',
                            animation: `fly 2s ease-out ${delay}s forwards`,
                            '--x': `${offsetX}px`,
                            '--y': `${offsetY}px`,
                        }}
                    />
                ))}
            </div>
            <div className="Info">
                <div className="Title">{t('gifts.send_title', { name: profileData.name })}</div>
                <div className="Description">{t('gifts.send_description')}</div>
            </div>
            <div style={{ marginTop: 20 }}>
                {loading ? (
                    <div
                        style={{
                            margin: 'auto',
                            width: 'fit-content',
                        }}
                    >
                        <LineSpinner
                            size="35"
                            stroke="2"
                            speed="1"
                            color="var(--TEXT_COLOR)"
                        />
                    </div>
                ) : (
                    gifts.length > 0 ? (
                        <div className="Gifts">
                            {
                                gifts.map((gift: any, i) => (
                                    <Gift
                                        key={i}
                                        gift={gift}
                                        payButton={true}
                                        onPay={() => pay(gift)}
                                        ribbon={true}
                                        ribbonText={gift.quantity}
                                        ribbonStyle={gift.quantity > 0 ? null : { filter: 'grayscale(1)' }}
                                    />
                                ))
                            }
                        </div>
                    ) : (
                        <div className="UI-ErrorMessage">
                            {t('ups')}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default SendGift;
