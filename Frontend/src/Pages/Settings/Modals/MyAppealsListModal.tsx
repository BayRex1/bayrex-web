import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';
import Block from '../../../UIKit/Components/Layout/Block';
import { HandleTimeAge } from '../../../System/Elements/Handlers';
import '../../../System/UI/Appeals.scss';

interface Appeal {
    id: number;
    restriction_type: string;
    reason: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    created_at: string;
    reviewed_at?: string;
    response?: string;
}

const MyAppealsListModal = () => {
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'all'|'pending'|'under_review'|'approved'|'rejected'>('all');

    const statusText = {
        pending: 'Ожидает рассмотрения',
        under_review: 'На рассмотрении',
        approved: 'Одобрена',
        rejected: 'Отклонена'
    };

    const statusColor = {
        pending: 'var(--WARNING_COLOR)',
        under_review: 'var(--INFO_COLOR)',
        approved: 'var(--SUCCESS_COLOR)',
        rejected: 'var(--ERROR_COLOR)'
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
                action: 'appeals/load_my',
                payload: {}
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
    }, [wsClient]);

    useEffect(() => {
        loadAppeals();
    }, [loadAppeals]);

    const formatRestrictionType = (type: string) => {
        return restrictionText[type] || type;
    };

    if (loading) {
        return (
            <div className="MyAppeals-Content">
                <Block>
                    <div className="loading-container"><div className="loading-spinner">Загрузка...</div></div>
                </Block>
            </div>
        );
    }

    const filtered = status === 'all' ? appeals : appeals.filter(a => a.status === status);

    return (
        <div className="AppealsReview">
            <Block>
                <div className="AppealsReview-Header">
                    <h3>Мои апелляции</h3>
                    <p>Здесь отображаются все ваши поданные апелляции</p>
                </div>

                <div className="AppealsReview-Filters">
                    <button className={status==='all' ? 'active' : ''} onClick={()=>setStatus('all')}>Все</button>
                    <button className={status==='pending' ? 'active' : ''} onClick={()=>setStatus('pending')}>Ожидают</button>
                    <button className={status==='under_review' ? 'active' : ''} onClick={()=>setStatus('under_review')}>На рассмотрении</button>
                    <button className={status==='approved' ? 'active' : ''} onClick={()=>setStatus('approved')}>Одобрены</button>
                    <button className={status==='rejected' ? 'active' : ''} onClick={()=>setStatus('rejected')}>Отклонены</button>
                </div>

                {filtered.length === 0 ? (
                    <div className="AppealsReview-Empty">У вас нет поданных апелляций</div>
                ) : (
                    <div className="AppealsReview-List">
                        {filtered.map((appeal) => (
                            <div key={appeal.id} className="AppealsReview-Item">
                                <div className="AppealsReview-ItemHeader">
                                    <div className="User">{formatRestrictionType(appeal.restriction_type)}</div>
                                    <div className="Status" style={{ color: statusColor[appeal.status] }}>{statusText[appeal.status]}</div>
                                </div>

                                <div className="AppealsReview-ItemContent">
                                    <div className="Reason">
                                        <strong>Причина апелляции</strong>
                                        <p>{appeal.reason}</p>
                                    </div>
                                    {appeal.response && (
                                        <div className="Response">
                                            <strong>Ответ модератора</strong>
                                            <p>{appeal.response}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="AppealsReview-ItemFooter">
                                    <div className="Date">Подана: <HandleTimeAge inputDate={appeal.created_at} /></div>
                                    {appeal.reviewed_at && (
                                        <div className="Date">Рассмотрена: <HandleTimeAge inputDate={appeal.reviewed_at} /></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <button className="UI-Window_button" onClick={() => openModal({ type: 'close' })}>Закрыть</button>
                </div>
            </Block>
        </div>
    );
};

export default MyAppealsListModal;