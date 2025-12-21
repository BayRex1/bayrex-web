import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';
import { HandleTimeAge } from '../../../System/Elements/Handlers';
import { I_CHECKMARK, I_CLOSE, I_CLOCK, I_WARNING } from '../../../System/UI/IconPack';
import SocialInput from '../../../UIKit/Components/Inputs/SocialInput';
import '../../../System/UI/Appeals.scss';

interface Appeal {
    id: number;
    user: {
        id: number;
        username: string;
        name: string;
        avatar?: any;
    };
    restriction_type: string;
    reason: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    created_at: string;
    reviewed_at?: string;
    response?: string;
    original_decision?: string;
    original_punishment_reason?: string;
    punishment_date?: string;
    reviewer_username?: string;
}

const AppealsReview = () => {
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');

    const statusColors = {
        pending: 'var(--WARNING_COLOR)',
        under_review: 'var(--INFO_COLOR)',
        approved: 'var(--SUCCESS_COLOR)',
        rejected: 'var(--ERROR_COLOR)'
    };

    const statusText = {
        pending: 'Ожидает рассмотрения',
        under_review: 'На рассмотрении',
        approved: 'Одобрена',
        rejected: 'Отклонена'
    };

    const restrictionText = {
        posts: 'Публикация постов',
        comments: 'Написание комментариев',
        chat: 'Создание чатов',
        music: 'Загрузка музыки'
    };

    const loadAppeals = useCallback(async () => {
        try {
            setLoading(true);
            const response = await wsClient.send({
                type: 'social',
                action: 'appeals/load_admin',
                payload: {
                    status: statusFilter === 'all' ? 'all' : statusFilter,
                    limit: 100,
                    offset: 0
                }
            });

            if (response.status === 'success') {
                setAppeals(response.appeals || []);
            } else {
                console.error('Ошибка загрузки апелляций:', response.message);
            }
        } catch (error) {
            console.error('Ошибка загрузки апелляций:', error);
        } finally {
            setLoading(false);
        }
    }, [wsClient, statusFilter]);

    useEffect(() => {
        loadAppeals();
    }, [loadAppeals]);

    const handleReviewAppeal = (appeal: Appeal) => {
        openModal({
            type: 'routed',
            props: {
                title: 'Рассмотрение апелляции',
                children: (
                    <ReviewAppealModal 
                        appeal={appeal} 
                        onClose={() => {
                            openModal({ type: 'close' });
                            loadAppeals();
                        }}
                    />
                )
            }
        });
    };

    const handleQuickAction = async (appealId: number, action: 'approve' | 'reject', defaultResponse: string) => {
        try {
            const response = await wsClient.send({
                type: 'social',
                action: 'appeals/review',
                payload: {
                    appeal_id: appealId,
                    action,
                    response_text: defaultResponse
                }
            });

            if (response.status === 'success') {
                loadAppeals();
            } else {
                openModal({
                    type: 'alert',
                    props: {
                        title: 'Ошибка',
                        message: response.message || 'Не удалось обработать апелляцию'
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка обработки апелляции:', error);
        }
    };

    const getStatusCounts = () => {
        const counts = {
            pending: appeals.filter(a => a.status === 'pending').length,
            under_review: appeals.filter(a => a.status === 'under_review').length,
            approved: appeals.filter(a => a.status === 'approved').length,
            rejected: appeals.filter(a => a.status === 'rejected').length
        };
        return counts;
    };

    const filteredAppeals = appeals.filter(appeal => 
        statusFilter === 'all' || appeal.status === statusFilter
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">Загрузка апелляций...</div>
            </div>
        );
    }

    const counts = getStatusCounts();

    return (
        <div className="AppealsReview">
            <div className="AppealsReview-Header">
                <div className="AppealsReview-Filters">
                    <button 
                        className={statusFilter === 'pending' ? 'active' : ''}
                        onClick={() => setStatusFilter('pending')}
                    >
                        Ожидают ({counts.pending})
                    </button>
                    <button 
                        className={statusFilter === 'under_review' ? 'active' : ''}
                        onClick={() => setStatusFilter('under_review')}
                    >
                        На рассмотрении ({counts.under_review})
                    </button>
                    <button 
                        className={statusFilter === 'approved' ? 'active' : ''}
                        onClick={() => setStatusFilter('approved')}
                    >
                        Одобрены ({counts.approved})
                    </button>
                    <button 
                        className={statusFilter === 'rejected' ? 'active' : ''}
                        onClick={() => setStatusFilter('rejected')}
                    >
                        Отклонены ({counts.rejected})
                    </button>
                </div>
            </div>

            {filteredAppeals.length === 0 ? (
                <div className="AppealsReview-Empty">
                    <p>Нет апелляций с статусом "{statusText[statusFilter] || statusFilter}"</p>
                </div>
            ) : (
                <div className="AppealsReview-List">
                    {filteredAppeals.map((appeal) => (
                        <div key={appeal.id} className="AppealsReview-Item">
                            <div className="AppealsReview-ItemHeader">
                                <div className="User">
                                    <strong>@{appeal.user.username}</strong> ({appeal.user.name})
                                </div>
                                <div className="Status" style={{ color: statusColors[appeal.status] }}>
                                    {appeal.status === 'pending' && <I_CLOCK />}
                                    {appeal.status === 'under_review' && <I_WARNING />}
                                    {appeal.status === 'approved' && <I_CHECKMARK />}
                                    {appeal.status === 'rejected' && <I_CLOSE />}
                                    {statusText[appeal.status]}
                                </div>
                            </div>

                            <div className="AppealsReview-ItemContent">
                                <div className="Restriction">
                                    <strong>Ограничение:</strong> {restrictionText[appeal.restriction_type]}
                                </div>
                                
                                <div className="Reason">
                                    <strong>Причина апелляции:</strong>
                                    <p>{appeal.reason}</p>
                                </div>

                                {appeal.original_punishment_reason && (
                                    <div className="OriginalReason">
                                        <strong>Первоначальная причина наказания:</strong>
                                        <p>{appeal.original_punishment_reason}</p>
                                    </div>
                                )}

                                {appeal.response && (
                                    <div className="Response">
                                        <strong>Ответ модератора:</strong>
                                        <p>{appeal.response}</p>
                                        {appeal.reviewer_username && (
                                            <small>Рассмотрел: @{appeal.reviewer_username}</small>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="AppealsReview-ItemFooter">
                                <div className="Date">
                                    Подана: <HandleTimeAge inputDate={appeal.created_at} />
                                    {appeal.reviewed_at && (
                                        <span> • Рассмотрена: <HandleTimeAge inputDate={appeal.reviewed_at} /></span>
                                    )}
                                </div>

                                {(appeal.status === 'pending' || appeal.status === 'under_review') && (
                                    <div className="Actions">
                                        <button
                                            className="AppealsReview-ActionBtn approve"
                                            onClick={() => handleQuickAction(appeal.id, 'approve', 'Апелляция одобрена. Ограничение снято.')}
                                        >
                                            <I_CHECKMARK />
                                            Одобрить
                                        </button>
                                        <button
                                            className="AppealsReview-ActionBtn reject"
                                            onClick={() => handleQuickAction(appeal.id, 'reject', 'Апелляция отклонена. Нарушение подтверждено.')}
                                        >
                                            <I_CLOSE />
                                            Отклонить
                                        </button>
                                        <button
                                            className="AppealsReview-ActionBtn review"
                                            onClick={() => handleReviewAppeal(appeal)}
                                        >
                                            Подробнее
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ReviewAppealModal = ({ appeal, onClose }) => {
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();
    const [responseText, setResponseText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReview = async (action: 'approve' | 'reject') => {
        if (!responseText.trim()) {
            openModal({
                type: 'alert',
                props: {
                    title: 'Ошибка',
                    message: 'Укажите ответ модератора'
                }
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await wsClient.send({
                type: 'social',
                action: 'appeals/review',
                payload: {
                    appeal_id: appeal.id,
                    action,
                    response_text: responseText.trim()
                }
            });

            if (response.status === 'success') {
                openModal({
                    type: 'alert',
                    props: {
                        title: 'Успешно',
                        message: `Апелляция ${action === 'approve' ? 'одобрена' : 'отклонена'}`
                    }
                });
                onClose();
            } else {
                openModal({
                    type: 'alert',
                    props: {
                        title: 'Ошибка',
                        message: response.message || 'Не удалось обработать апелляцию'
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка обработки апелляции:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="ReviewAppealModal">
            <div className="ReviewAppealModal-Content">
                <div className="Appeal-Info">
                    <h4>Пользователь: @{appeal.user.username} ({appeal.user.name})</h4>
                    <p><strong>Ограничение:</strong> {appeal.restriction_type}</p>
                    <p><strong>Причина апелляции:</strong></p>
                    <div className="Appeal-Reason">{appeal.reason}</div>
                </div>

                <div className="Response-Field">
                    <label>Ответ модератора:</label>
                    <SocialInput
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Укажите решение и обоснование..."
                        maxLength={1000}
                        simple={true}
                    />
                    <div className="Response-Counter">{responseText.length}/1000</div>
                </div>

                <div className="ReviewAppealModal-Actions">
                    <button
                        className="UI-Window_button approve"
                        onClick={() => handleReview('approve')}
                        disabled={isSubmitting || !responseText.trim()}
                    >
                        {isSubmitting ? 'Обработка...' : 'Одобрить'}
                    </button>
                    <button
                        className="UI-Window_button reject"
                        onClick={() => handleReview('reject')}
                        disabled={isSubmitting || !responseText.trim()}
                    >
                        {isSubmitting ? 'Обработка...' : 'Отклонить'}
                    </button>
                    <button
                        className="UI-Window_BTN_NOACT UI-Window_button"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppealsReview;
