import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { Block, PartitionName, Button } from '../../../UIKit';
import { I_CLOSE } from '../../../System/UI/IconPack';
import '../../../System/UI/Moderation.scss';

interface DashboardStats {
    period: string;
    reports: {
        total: number;
        pending: number;
        under_review: number;
        resolved: number;
        rejected: number;
    };
    punishments: {
        total: number;
        active: number;
        by_type: Array<{ type: string; count: number }>;
    };
    categories: Array<{ category: string; count: number; percentage: number }>;
    daily_activity: Array<{ date: string; reports_count: number; resolved_count: number }>;
    moderators: Array<{
        moderator_id: number;
        moderator_name: string;
        moderator_username: string;
        reports_handled: number;
        punishments_applied: number;
        last_activity: string;
    }>;
    system: {
        total_reports: number;
        total_punishments: number;
        total_actions: number;
        active_punishments: number;
    };
    response_time: number;
}

const LoadingSpinner = () => (
    <div className="loading-spinner">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="15">
                <animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite" />
            </circle>
        </svg>
    </div>
);

const StatCard = ({ title, value, subtitle }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
}) => (
    <Block style={{
        padding: 10,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 5 }}>
            <span style={{
                color: 'var(--TITLE_COLOR)',
                fontFamily: 'var(--FF_TITLE)',
                marginBottom: 15,
                fontSize: '1rem'
            }}>
                {title}
            </span>
        </div>
        <div>
            <div style={{
                color: 'var(--TITLE_COLOR)',
                fontSize: '28px',
                fontWeight: 'bold',
                lineHeight: '1'
            }}>
                {value}
            </div>
            {subtitle && (
                <div style={{
                    color: 'var(--TEXT_COLOR_LITE)',
                    fontSize: '12px',
                    marginTop: '4px'
                }}>
                    {subtitle}
                </div>
            )}
        </div>
    </Block>
);

const ProgressBar = ({ value, max, color, label }: {
    value: number;
    max: number;
    color: string;
    label: string;
}) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    return (
        <div style={{ marginBottom: '12px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '13px'
            }}>
                <span style={{ color: 'var(--TEXT_COLOR)' }}>{label}</span>
                <span style={{ color: 'var(--TEXT_COLOR_LITE)' }}>{value} ({percentage.toFixed(1)}%)</span>
            </div>
            <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--BLOCK_BLOCK_COLOR)',
                borderRadius: '3px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: color,
                    transition: 'width 0.3s ease'
                }} />
            </div>
        </div>
    );
};

const ModerationDashboard = () => {
    const { wsClient } = useWebSocket();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7d');
    const [error, setError] = useState<string | null>(null);

    const loadStats = useCallback(async (selectedPeriod: string = period) => {
        try {
            setLoading(true);
            setError(null);

            const response = await wsClient.send({
                type: 'social',
                action: 'moderation/dashboard_stats',
                payload: { period: selectedPeriod }
            });

            if (response.status === 'success') {
                setStats(response);
            } else {
                setError(response.message || 'Ошибка загрузки статистики');
            }
        } catch (err) {
            console.error('Ошибка загрузки дашборда:', err);
            setError('Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    }, [wsClient, period]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const periodTabs = [
        { label: 'Сегодня', value: '1d' },
        { label: '7 дней', value: '7d' },
        { label: '30 дней', value: '30d' },
        { label: 'Все время', value: 'all' }
    ];

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <LoadingSpinner />
                <span style={{ color: 'var(--TEXT_COLOR)' }}>Загрузка статистики...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="UI-Block" style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--TEXT_COLOR)'
            }}>
                <I_CLOSE style={{ marginBottom: 16 }} />
                <div>Ошибка: {error}</div>
                <Button
                    title="Попробовать снова"
                    onClick={() => loadStats()}
                    style={{ marginTop: '16px' }}
                />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <PartitionName name="Дашборд модерации" />
                <Block style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                    {periodTabs.map(tab => (
                        <button
                            key={tab.value}
                            className={period === tab.value ? 'UI-Button UI-Button--action' : 'UI-Button'}
                            onClick={() => {
                                setPeriod(tab.value);
                                loadStats(tab.value);
                            }}
                            style={{ fontSize: '13px', padding: '8px 12px' }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </Block>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 5
            }}>
                <StatCard
                    title="Всего жалоб"
                    value={stats.reports.total}
                    subtitle={`За ${period === '1d' ? 'сегодня' : period === '7d' ? '7 дней' : period === '30d' ? '30 дней' : 'все время'}`}
                    color="#f59e0b"
                />
                <StatCard
                    title="На рассмотрении"
                    value={stats.reports.under_review}
                    subtitle={stats.reports.pending > 0 ? `+${stats.reports.pending} новых` : 'Новых нет'}
                    color="#3b82f6"
                />
                <StatCard
                    title="Решено"
                    value={stats.reports.resolved}
                    subtitle={`${Math.round((stats.reports.resolved / (stats.reports.total || 1)) * 100)}% от общего`}
                    color="#10b981"
                />
                <StatCard
                    title="Активные наказания"
                    value={stats.punishments.active}
                    subtitle={`Всего: ${stats.punishments.total}`}
                    color="#ef4444"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                <Block style={{ padding: 10 }}>
                    <div style={{
                        color: 'var(--TITLE_COLOR)',
                        fontFamily: 'var(--FF_TITLE)',
                        marginBottom: 15,
                        fontSize: '1rem'
                    }}>
                        Топ категории жалоб
                    </div>
                    {stats.categories.length > 0 ? (
                        <div>
                            {stats.categories.slice(0, 5).map((category, index) => (
                                <ProgressBar
                                    key={category.category}
                                    value={category.count}
                                    max={stats.categories[0]?.count || 1}
                                    color={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : index === 2 ? '#3b82f6' : '#6b7280'}
                                    label={category.category}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            color: 'var(--TEXT_COLOR_LITE)',
                            textAlign: 'center',
                            padding: '20px'
                        }}>
                            Нет данных за выбранный период
                        </div>
                    )}
                </Block>

                <Block style={{ padding: 10 }}>
                    <div style={{
                        color: 'var(--TITLE_COLOR)',
                        fontFamily: 'var(--FF_TITLE)',
                        marginBottom: 15,
                        fontSize: '1rem'
                    }}>
                        Активность модераторов
                    </div>
                    {stats.moderators.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {stats.moderators.slice(0, 5).map((moderator) => (
                                <div key={moderator.moderator_id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--BLOCK_BLOCK_COLOR)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', color: 'var(--TEXT_COLOR)' }}>
                                            {moderator.moderator_name}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: 'var(--TEXT_COLOR_LITE)',
                                        textAlign: 'right'
                                    }}>
                                        <div>{moderator.reports_handled} жалоб</div>
                                        <div>{moderator.punishments_applied} наказаний</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            color: 'var(--TEXT_COLOR_LITE)',
                            textAlign: 'center',
                            padding: '20px'
                        }}>
                            Нет активности за выбранный период
                        </div>
                    )}
                </Block>
            </div>

            <Block style={{ padding: 10 }}>
                <div style={{
                    color: 'var(--TITLE_COLOR)',
                    fontFamily: 'var(--FF_TITLE)',
                    marginBottom: 15,
                    fontSize: '1rem'
                }}>
                    Общая статистика системы
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '16px',
                    textAlign: 'center'
                }}>
                    <div>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: 'var(--ACCENT_COLOR)'
                        }}>
                            {stats.system.total_reports}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--TEXT_COLOR)' }}>
                            Всего жалоб
                        </div>
                    </div>
                    <div>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: 'var(--ACCENT_COLOR)'
                        }}>
                            {stats.system.total_actions}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--TEXT_COLOR)' }}>
                            Действий модераторов
                        </div>
                    </div>
                    <div>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: 'var(--ACCENT_COLOR)'
                        }}>
                            {stats.response_time}ч
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--TEXT_COLOR)' }}>
                            Среднее время отклика
                        </div>
                    </div>
                    <div>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: stats.system.active_punishments > 0 ? '#ef4444' : '#10b981'
                        }}>
                            {stats.system.active_punishments}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--TEXT_COLOR)' }}>
                            Активных наказаний
                        </div>
                    </div>
                </div>
            </Block>
        </div>
    );
};

export default ModerationDashboard; 
