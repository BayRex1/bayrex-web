import { useTranslation } from 'react-i18next';
import { Button, Textarea, TextInput, User } from '../../../UIKit';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../System/Hooks/useAuth';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { I_CLOSE } from '../../../System/UI/IconPack';
import { useModalsStore } from '../../../Store/modalsStore';

const Transfer = ({ onClose }) => {
    const { t } = useTranslation();
    const { accountData, updateAccount } = useAuth();
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        if (!recipient) {
            setUsers([]);
            return;
        };

        wsClient.send({
            type: 'social',
            action: 'search',
            category: 'users',
            value: recipient,
        }).then((res: any) => {
            if (res.status === 'success') {
                setUsers(res.results);
            }
        })
    }, [recipient]);

    const parseAmount = (value: string) => {
        const num = parseFloat(value.replace(',', '.'));
        return isNaN(num) || num <= 0 ? 0 : num;
    };

    const send = () => {
        setIsLoading(true);

        wsClient.send({
            type: 'social',
            action: 'eball/send',
            payload: {
                recipient: Number(selectedUser.id),
                amount: Number(amount),
                message: message
            }
        }).then((res) => {
            setIsLoading(false);
            if (res.status === 'success') {
                updateAccount({
                    e_balls: accountData.e_balls - Number(amount)
                })
                setIsCompleted(true);
            } else if (res.status === 'error') {
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

    const selectUser = (user) => {
        setSelectedUser(user);
    }

    const closeUser = () => {
        setSelectedUser('');
    }

    const sendAgain = () => {
        setIsCompleted(false);
    }

    const amountNumber = parseAmount(amount);
    const fee = amountNumber * 0.1;
    const total = amountNumber + fee;
    const balanceAfter = accountData.e_balls - total;

    return (
        <>
            <div className="Balance-Transfer">
                {
                    !isCompleted ? (
                        <>
                            <img
                                className="EliraSend"
                                src="/static_sys/Images/Elira/EliraSend.webp"
                                alt="фыр"
                                draggable={false}
                            />
                            <div className="Form">
                                <div className="BalanceState">
                                    <div className="Text">
                                        {t('balance.state')}
                                    </div>
                                    <div className="Count">
                                        {accountData.e_balls}
                                        <div className="UI-Eball">Е</div>
                                    </div>
                                </div>
                                {
                                    selectedUser ? (
                                        <div className="SelectedUser">
                                            <User
                                                user={selectedUser}
                                            />
                                            <button onClick={closeUser} className="Close">
                                                <I_CLOSE />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <TextInput
                                                value={recipient}
                                                onChange={(e: any) => { setRecipient(e.target.value) }}
                                                placeholder={t('balance.recipient')}
                                                transparent={true}
                                            />
                                            {
                                                users.length > 0 && (
                                                    <div className="Users">
                                                        {
                                                            users.map((user, i) => (
                                                                <User
                                                                    key={i}
                                                                    user={user}
                                                                    onClick={() => { selectUser(user) }}
                                                                />
                                                            ))
                                                        }
                                                    </div>
                                                )
                                            }
                                        </>
                                    )
                                }
                                <TextInput
                                    value={amount}
                                    onChange={(e: any) => { setAmount(e.target.value) }}
                                    placeholder={t('balance.transfer_amount')}
                                    transparent={true}
                                />
                                {selectedUser && amountNumber > 0 && (
                                    <div className="TransferDetails">
                                        <div className="DetailRow">
                                            {t('balance.transfer_amount')}:
                                            <div className="Count">
                                                {amountNumber.toFixed(2)}
                                                <div className="UI-Eball">Е</div>
                                            </div>
                                        </div>
                                        <div className="DetailRow">
                                            {t('balance.fee')} (10%):
                                            <div className="Count">
                                                {fee.toFixed(2)}
                                                <div className="UI-Eball">Е</div>
                                            </div>
                                        </div>
                                        <div className="DetailRow">
                                            {t('balance.after_transfer')}:
                                            <div className="Count" style={{ color: balanceAfter < 0 ? 'red' : 'inherit' }}>
                                                {balanceAfter.toFixed(2)}
                                                <div className="UI-Eball">Е</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <Textarea
                                    value={message}
                                    onChange={(e: any) => { setMessage(e.target.value) }}
                                    placeholder={t('balance.message')}
                                    transparent={true}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <img
                                className="EliraSend"
                                src="/static_sys/Images/Elira/EliraSendEnd.webp"
                                alt="фыр"
                                draggable={false}
                            />

                            <div className="UI-ErrorMessage">
                                {t('balance.send_complete')}
                            </div>
                        </>
                    )
                }
            </div>
            <div className="Footer">
                {
                    !isCompleted ? (
                        <Button
                            title={t('send')}
                            buttonStyle="action"
                            style={{ width: '100%' }}
                            onClick={send}
                            isLoading={isLoading}
                            isActive={Boolean(selectedUser && parseAmount(amount) > 0)}
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                            <Button
                                title={t('close')}
                                style={{ width: '100%' }}
                                onClick={onClose}
                                isLoading={isLoading}
                                isActive={Boolean(selectedUser && parseAmount(amount) > 0)}
                            />
                            <Button
                                title={t('send_again')}
                                buttonStyle="action"
                                style={{ width: '100%' }}
                                onClick={sendAgain}
                                isLoading={isLoading}
                                isActive={Boolean(selectedUser && parseAmount(amount) > 0)}
                            />
                        </div>
                    )
                }
            </div>
        </>
    )
}

export default Transfer;
