import { useTranslation } from 'react-i18next';
import { AddButton, ContextMenu, Gift } from '../../../UIKit';
import { useModalsStore } from '../../../Store/modalsStore';
import AddGift from '../Modals/AddGift';
import { useEffect, useState } from 'react';
import { LineSpinner } from 'ldrs/react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { I_DELETE } from '../../../System/UI/IconPack';

const Gifts = () => {
    const { t } = useTranslation();
    const { openModal } = useModalsStore();
    const { wsClient } = useWebSocket();
    const [gifts, setGifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadGifts = () => {
        wsClient.send({
            type: 'social',
            action: 'gifts/load'
        }).then((res) => {
            if (res.status === 'success') {
                setGifts(res.gifts || []);
            } else {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('error'),
                        message: res.message
                    }
                });
            }
            setLoading(false);
        })
    }

    const add = () => {
        openModal({
            type: 'routed',
            props: {
                title: t('gifts.add'),
                children: <AddGift loadGifts={loadGifts} />
            }
        })
    }

    useEffect(() => {
        loadGifts();
    }, []);

    const deleteGift = (gift) => {
        wsClient.send({
            type: 'social',
            action: 'dashboard/gifts/delete',
            payload: {
                gift_id: gift.id
            }
        }).then((res) => {
            if (res.status === 'error') {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('error'),
                        message: res.message
                    }
                });
            }
            loadGifts();
        })
    }

    const items = [
        {
            icon: <I_DELETE />,
            title: t('delete'),
            onClick: deleteGift
        }
    ];

    return (
        <>
            <div className="UI-B_FIRST">
                <AddButton
                    title={t('add')}
                    onClick={add}
                />
            </div>
            <div
                style={{
                    marginTop: 10
                }}
            >
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
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
                                gap: 7,
                                width: '100%',
                                marginBottom: 10
                            }}
                        >
                            {gifts.map((gift, i) => (
                                <ContextMenu items={items} props={gift}>
                                    <Gift
                                        key={i}
                                        gift={gift}
                                        style={{ hight: '100%' }}
                                    />
                                </ContextMenu>
                            ))}
                        </div>
                    ) : (
                        <div className="UI-ErrorMessage">
                            {t('ups')}
                        </div>
                    )
                )}
            </div>
        </>
    )
}

export default Gifts;
