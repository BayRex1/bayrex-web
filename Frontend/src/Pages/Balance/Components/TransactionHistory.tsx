import { useTranslation } from 'react-i18next';
import { I_TRANSFER } from '../../../System/UI/IconPack';
import { useEffect, useState } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useInView } from 'react-intersection-observer';
import { HandleTimeAge } from '../../../System/Elements/Handlers';
import { Avatar } from '../../../UIKit';
import { NavLink } from 'react-router-dom';
import { LineSpinner } from 'ldrs/react';

const TransactionItem = ({ transaction }) => {
    const { t } = useTranslation();

    if (transaction.type === 'gift_pay') {
        const { sender, gift, gift_recipient, amount, date, message, is_incoming } = transaction;

        console.log(transaction);;

        return (
            <div className="Transaction-Item">
                <div className="Transaction-Icon">
                    <div className="Avatar-Left">
                        <Avatar
                            avatar={sender?.avatar}
                            name={sender?.name}
                            size={15}
                        />
                    </div>
                    <div className="Avatar-Right">
                        <Avatar
                            avatar={gift_recipient?.avatar}
                            name={gift_recipient?.name}
                            size={15}
                        />
                    </div>
                    <div className="Gift-Icon">
                        {
                            gift?.image?.preview && (
                                <img
                                    src={gift.image.preview}
                                    style={{
                                        height: 30
                                    }}
                                    alt="фыр"
                                    draggable={false}
                                />
                            )
                        }
                    </div>
                </div>
                <div className="Transaction-Info">
                    <div className="Transaction-Title">
                        {is_incoming ? 'Подарок получен' : 'Подарок отправлен'}
                    </div>
                    {gift?.name && <div className="Gift-Name">{gift.name}</div>}
                    <div className="Transaction-Date">
                        <HandleTimeAge inputDate={date} />
                    </div>
                    {
                        message && (
                            <div className="Message">
                                {message}
                            </div>
                        )
                    }
                </div>
                <div className="Transaction-Amount">
                    <div className="Count">{is_incoming ? '+' : '-'}{amount || 0}</div>
                    <div className="UI-Eball">Е</div>
                </div>
            </div>
        );
    }

    const { is_incoming, sender, recipient, amount, fee, date, message } = transaction;
    const user = is_incoming ? sender?.username : recipient?.username;

    const amountNum = Number(amount) || 0;
    const feeNum = Number(fee) || 0;

    const total = amountNum + feeNum;

    return (
        <div className="Transaction-Item">
            <div className="Transaction-Icon">
                <div className="Avatar-Left">
                    <Avatar
                        avatar={sender?.avatar}
                        name={sender?.name}
                        size={20}
                    />
                </div>
                <I_TRANSFER />
                <div className="Avatar-Right">
                    <Avatar
                        avatar={recipient?.avatar}
                        name={recipient?.name}
                        size={20}
                    />
                </div>
            </div>
            <div className="Transaction-Info">
                <div className="Transaction-Title">
                    {is_incoming
                        ? t('balance.transactions.received_from')
                        : t('balance.transactions.sent_to')}
                    {user ? (
                        <NavLink to={`/e/${user}`}>
                            @{user}
                        </NavLink>
                    ) : (
                        <span>@неизвестный</span>
                    )}
                </div>
                <div className="Transaction-Date">
                    <HandleTimeAge inputDate={date} />
                </div>
                {
                    message && (
                        <div className="Message">
                            {message}
                        </div>
                    )
                }
            </div>
            <div className="Transaction-Amount">
                <div className="Count">
                    {is_incoming ? `+${amountNum.toFixed(3)}` : `-${total.toFixed(3)}`}
                </div>
                <div className="UI-Eball">E</div>
            </div>
        </div>
    );
};

const TransactionHistory = () => {
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    const [isLoaded, setIsLoaded] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [si, setSI] = useState(0);
    const { ref: loadRef, inView: isViewed } = useInView({
        threshold: 0
    });


    const loadTransitions = async (start_index) => {
        const res = await wsClient.send({
            type: 'social',
            action: 'eball/load_history',
            payload: {
                start_index: start_index
            }
        })

        if (res.status === 'success') {
            return res.transactions
        } else {
            return [];
        }
    }

    useEffect(() => {
        loadTransitions(0).then((trans) => {
            setTransactions(trans);
            setSI(25);
            setIsLoaded(true);
        })
    }, []);

    useEffect(() => {
        if (isViewed) {
            loadTransitions(si).then((trans) => {
                setTransactions(prev => [...prev, ...trans]);
                setSI(prev => prev + trans.length);
            })
        }
    }, [isViewed])

    return (
        <>
            {
                isLoaded ? (
                    transactions.length > 0 ? (
                        transactions.map((transaction, i) => (
                            <TransactionItem
                                key={i}
                                transaction={transaction}
                            />
                        ))
                    ) : (
                        <div className="UI-ErrorMessage">{t('ups')}</div>
                    )
                ) : (
                    <div
                        style={{
                            margin: 'auto',
                            marginTop: 10,
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
                )
            }
            {
                isLoaded && (
                    <span ref={loadRef} />
                )
            }
        </>
    );
};

export default TransactionHistory; 
