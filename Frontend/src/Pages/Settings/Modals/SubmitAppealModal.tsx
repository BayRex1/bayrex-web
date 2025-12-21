import { useState } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';
import SocialInput from '../../../UIKit/Components/Inputs/SocialInput';
import Block from '../../../UIKit/Components/Layout/Block';

interface SubmitAppealModalProps {
    restrictionType: 'posts' | 'comments';
}

const SubmitAppealModal = ({ restrictionType }: SubmitAppealModalProps) => {
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const restrictionText = {
        posts: 'ограничения на публикацию постов',
        comments: 'ограничения на написание комментариев'
    };

    const checkExistingAppeal = async () => {
        try {
            const response = await wsClient.send({
                type: 'social',
                action: 'appeals/check_existing',
                payload: {
                    restriction_type: restrictionType
                }
            });

            if (response.status === 'error' && response.message === 'APPEAL_EXISTS') {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка проверки существующей апелляции:', error);
            return false;
        }
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            openModal({
                type: 'alert',
                props: {
                    title: 'Ошибка',
                    message: 'Укажите причину апелляции'
                }
            });
            return;
        }

        const existingAppeal = await checkExistingAppeal();
        if (existingAppeal) {
            openModal({
                type: 'alert',
                props: {
                    title: 'Ошибка',
                    message: 'У вас уже есть активная апелляция по данному ограничению'
                }
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await wsClient.send({
                type: 'social',
                action: 'appeals/submit',
                payload: {
                    restriction_type: restrictionType,
                    reason: reason.trim()
                }
            });

            if (response.status === 'success') {
                openModal({ type: 'close' });
                
                setTimeout(() => {
                    openModal({
                        type: 'alert',
                        props: {
                            title: 'Успешно',
                            message: 'Апелляция подана успешно! Посмотреть статус можно в разделе "Мои апелляции"'
                        }
                    });
                }, 100);
            } else {
                openModal({
                    type: 'alert',
                    props: {
                        title: 'Ошибка',
                        message: response.message || 'Не удалось подать апелляцию'
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка подачи апелляции:', error);
            openModal({
                type: 'alert',
                props: {
                    title: 'Ошибка',
                    message: 'Произошла ошибка при подаче апелляции'
                }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Block style={{ padding: 20, maxWidth: 520 }}>
            <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: 'var(--TEXT_COLOR)' }}>Подача апелляции</h3>
                <p style={{ margin: 0, color: 'var(--D_OR_P_COLOR)' }}>Вы подаете апелляцию на {restrictionText[restrictionType]}</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: 'var(--TEXT_COLOR)', 
                    fontWeight: '500' 
                }}>
                    Причина апелляции
                </label>
                <SocialInput
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Опишите, почему вы считаете ограничение несправедливым..."
                    maxLength={2000}
                />
                <div style={{ 
                    textAlign: 'right', 
                    fontSize: '12px', 
                    color: 'var(--D_OR_P_COLOR)', 
                    marginTop: '4px' 
                }}>
                    {reason.length}/2000
                </div>
            </div>

            <Block style={{ marginBottom: 16, padding: 12 }}>
                <strong>Обратите внимание:</strong>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Каждое ограничение позволяет подать только одну апелляцию</li>
                    <li>Рассмотрение может занять до 24 рабочих часов</li>
                    <li>Ложные апелляции могут привести к дополнительным ограничениям</li>
                </ul>
            </Block>

        <div className="ReviewAppealModal-Actions">
            <button
                className="UI-Window_button"
                onClick={handleSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Отправка...' : 'Подать апелляцию'}
            </button>
            <button
                className="UI-Window_BTN_NOACT UI-Window_button"
                onClick={() => openModal({ type: 'close' })}
                disabled={isSubmitting}
            >
                Отмена
            </button>
        </div>
        </Block>
    );
};

export default SubmitAppealModal;