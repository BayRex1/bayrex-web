import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { I_CLOCK, I_CHECKMARK, I_CLOSE, I_REPORT } from '../../../System/UI/IconPack';

interface HistoryItem {
    id: number;
    action_type: string;
    target_type: string;
    target_id: string;
    created_at: string;
    details: any;
    moderator: {
        id: number;
        username: string;
        name: string;
        avatar: string;
    };
    report?: {
        id: number;
        category: string;
        message: string;
        status: string;
    };
    punishment?: {
        id: number;
        type: string;
        reason: string;
        duration_hours: number;
        start_date: string;
        end_date: string;
        is_active: boolean;
    };
}

interface ModerationHistoryProps {
    targetType?: string;
    targetId?: string;
    reportId?: number;
    punishmentId?: number;
}

const ModerationHistory = ({ targetType, targetId, reportId, punishmentId }: ModerationHistoryProps) => {
    const { wsClient } = useWebSocket();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    const loadHistory = useCallback(async (isLoadMore = false) => {
        if (loading) return;
        
        setLoading(true);
        
        try {
            const res = await wsClient.send({
                type: 'social',
                action: 'moderation/load_history',
                payload: {
                    target_type: targetType,
                    target_id: targetId,
                    report_id: reportId,
                    punishment_id: punishmentId,
                    limit: 20,
                    offset: isLoadMore ? offset : 0
                }
            });

            if (res?.status === 'success') {
                const newHistory = res.history || [];
                
                if (isLoadMore) {
                    setHistory(prev => [...prev, ...newHistory]);
                    setOffset(prev => prev + newHistory.length);
                } else {
                    setHistory(newHistory);
                    setOffset(newHistory.length);
                }
                
                setHasMore(res.hasMore || false);
            }
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
        } finally {
            setLoading(false);
        }
    }, [wsClient, targetType, targetId, reportId, punishmentId, offset, loading]);

    useEffect(() => {
        loadHistory();
    }, [targetType, targetId, reportId, punishmentId]);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getActionText = (actionType: string, moderator?: any) => {
        switch (actionType) {
            case 'report_created': return 'Жалоба создана';
            case 'report_reviewed': return moderator ? `Жалоба взята на рассмотрение модератором ${moderator.name}` : 'Взята в работу';
            case 'report_resolved': return 'Жалоба решена';
            case 'report_rejected': return 'Жалоба отклонена';
            case 'punishment_applied': return 'Применено наказание';
            case 'punishment_lifted': return 'Наказание снято';
            default: return actionType;
        }
    };

    const getActionColor = (actionType: string) => {
        switch (actionType) {
            case 'report_created': return '#ff9800';
            case 'report_reviewed': return '#2196f3';
            case 'report_resolved': 
            case 'punishment_applied': return '#4caf50';
            case 'report_rejected': return '#f44336';
            case 'punishment_lifted': return '#9c27b0';
            default: return '#666';
        }
    };

    const getPunishmentText = (type: string) => {
        switch (type) {
            case 'warn': return 'Предупреждение';
            case 'restrict_posts': return 'Ограничение постов';
            case 'restrict_comments': return 'Ограничение комментариев';
            case 'restrict_chat': return 'Ограничение чатов';
            case 'restrict_music': return 'Ограничение музыки';
            case 'ban': return 'Блокировка';
            default: return type;
        }
    };

    if (history.length === 0 && !loading) {
        return (
            <div className="empty-state">
                <I_REPORT />
                <div>История модерации пуста</div>
                <div>Здесь будут отображаться все действия модераторов</div>
            </div>
        );
    }

    return (
        <>
            <div className="UI-PB_Column">
                {history.map((item) => (
                    <div key={item.id} className="UI-Block MyReport-Item">
                        <div className="MyReport-Header">
                            <div className="MyReport-Target">
                                <span
                                    className="target-type"
                                    style={{ backgroundColor: getActionColor(item.action_type) }}
                                >
                                    {getActionText(item.action_type, item.moderator)}
                                </span>
                                <span className="target-name">
                                    {item.moderator.name} (@{item.moderator.username})
                                </span>
                            </div>
                            <div className="MyReport-Date">
                                {formatDate(item.created_at)}
                            </div>
                        </div>

                        {(item.report || item.punishment) && (
                            <div className="MyReport-Content">
                                {item.report && (
                                    <div className="MyReport-Message">
                                        <strong>#{item.report.id}: {item.report.category}</strong>
                                        {item.report.message && ` — ${item.report.message}`}
                                    </div>
                                )}

                                {item.punishment && (
                                    <div className="MyReport-Message">
                                        <strong>Тип:</strong> {getPunishmentText(item.punishment.type)}
                                        {item.punishment.is_active && <span style={{ color: '#D32F2F' }}> (Активно)</span>}
                                        <br />
                                        <strong>Причина:</strong> {item.punishment.reason}
                                        {item.punishment.duration_hours && (
                                            <>
                                                <br />
                                                <strong>Длительность:</strong> {item.punishment.duration_hours} часов
                                            </>
                                        )}
                                        {item.punishment.end_date && (
                                            <>
                                                <br />
                                                <strong>До:</strong> {formatDate(item.punishment.end_date)}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="UI-Block" style={{ textAlign: 'center', padding: '20px' }}>
                        <div className="UI-PRELOAD" style={{ 
                            width: '30px', 
                            height: '30px', 
                            margin: '0 auto 10px',
                            borderRadius: '50%'
                        }}></div>
                        <div style={{ fontSize: '0.9em', color: 'var(--D_OR_P_COLOR)' }}>
                            Загрузка...
                        </div>
                    </div>
                )}

                {hasMore && !loading && (
                    <div className="UI-Block" style={{ textAlign: 'center', padding: '15px' }}>
                        <button 
                            className="UI-Button UI-Button--action" 
                            onClick={() => loadHistory(true)}
                            style={{ width: '100%' }}
                        >
                            Загрузить еще
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default ModerationHistory; 
