import { useWebSocket } from '../../../System/Context/WebSocket';
import { useEffect, useState } from 'react';
import { I_CHECKMARK } from '../../../System/UI/IconPack';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useModalsStore } from '../../../Store/modalsStore';
import LottieAnimation from '../../../UIKit/Components/Base/LotteAnimation';
import { Block } from '../../../UIKit';

interface Report {
    id: number;
    target_type: string;
    target_id: number;
    category: string;
    message: string;
    status: string;
    created_at: string;
    updated_at?: string;
    resolution?: string;
    admin_id?: number;
    target_info?: {
        username?: string;
        name?: string;
        content?: string;
        text?: string;
    };
    moderator_info?: {
        id: number;
        username: string;
        name: string;
    };
}

const MyReports = () => {
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMyReports();
    }, []);

    const loadMyReports = async () => {
        setLoading(true);
        try {
            const response = await wsClient.send({
                type: 'social',
                action: 'moderation/load_my_reports',
                payload: {}
            });

            if (response.status === 'success') {
                setReports(response.reports || []);
            }
        } catch (error) {
            console.error('Ошибка загрузки жалоб:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Ожидает рассмотрения';
            case 'under_review': return 'На рассмотрении';
            case 'resolved': return 'Решена';
            case 'rejected': return 'Отклонена';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#ff9800';
            case 'under_review': return '#2196f3';
            case 'resolved': return '#4caf50';
            case 'rejected': return '#f44336';
            default: return '#666';
        }
    };

    const getTargetTypeText = (type: string): string => {
        return t(type) ?? type;
    };

    const getCategoryText = (category: string): string => {
        const translation = t(`report_reasons.${category}`);
        return translation ?? category;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleModeratorClick = (moderator: { id: number; username: string; name: string }) => {
        const { startClosingModal, stack } = useModalsStore.getState();
        const currentModal = stack[stack.length - 1];
        if (currentModal) {
            startClosingModal(currentModal.id);
        }
        navigate(`/profile/${moderator.username}`);
    };

    if (loading) {
        return (
            <div className="UI-Block">
                <div className="UI-Preload" style={{ height: 100 }} />
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="UI-ErrorMessage">
                <LottieAnimation
                    className="Emoji"
                    url="/static_sys/Lottie/Sorry.json"
                />
                Вы не подавали жалоб
            </div>
        );
    }

    return (
        <>
            <div className="UI-PartitionName">Ваши жалобы ({reports.length})</div>
            {reports.map((report) => (
                <Block key={report.id} className="MyReport-Item">
                    <div className="MyReport-Header">
                        <div className="MyReport-Target">
                            <span className="target-type">
                                {getTargetTypeText(report.target_type)}
                            </span>
                            {report.target_info?.username && (
                                <span className="target-name">
                                    @{report.target_info.username}
                                </span>
                            )}
                            {report.target_info?.name && (
                                <span className="target-name">
                                    {report.target_info.name}
                                </span>
                            )}
                        </div>
                        <div
                            className="MyReport-Status"
                            style={{ color: getStatusColor(report.status) }}
                        >
                            {getStatusText(report.status)}
                        </div>
                    </div>

                    <div className="MyReport-Content">
                        <div className="MyReport-Category">
                            <strong>Категория:</strong> {getCategoryText(report.category)}
                        </div>

                        {report.message && (
                            <div className="MyReport-Message">
                                <strong>Описание:</strong> {report.message}
                            </div>
                        )}

                        {report.target_info?.content && (
                            <div className="MyReport-TargetContent">
                                <strong>Содержимое:</strong>
                                <div className="content-preview">
                                    {typeof report.target_info.content === 'string'
                                        ? report.target_info.content.slice(0, 100)
                                        : String(report.target_info.content).slice(0, 100)
                                    }
                                    {(typeof report.target_info.content === 'string'
                                        ? report.target_info.content.length
                                        : String(report.target_info.content).length) > 100 && '...'}
                                </div>
                            </div>
                        )}

                        {report.target_info?.text && (
                            <div className="MyReport-TargetContent">
                                <strong>Текст:</strong>
                                <div className="content-preview">
                                    {typeof report.target_info.text === 'string'
                                        ? report.target_info.text.slice(0, 100)
                                        : String(report.target_info.text).slice(0, 100)
                                    }
                                    {(typeof report.target_info.text === 'string'
                                        ? report.target_info.text.length
                                        : String(report.target_info.text).length) > 100 && '...'}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="MyReport-Footer">
                        <div className="MyReport-Date">
                            Подана: {formatDate(report.created_at)}
                        </div>
                        {report.updated_at && report.status !== 'pending' && (
                            <div className="MyReport-Updated">
                                Обновлена: {formatDate(report.updated_at)}
                            </div>
                        )}
                    </div>

                    {report.resolution && (
                        <div className="MyReport-Resolution">
                            <div className="resolution-header">
                                <I_CHECKMARK />
                                <strong>Ответ модератора:</strong>
                            </div>
                            <div className="resolution-text">
                                {report.resolution}
                            </div>
                            {report.moderator_info && (
                                <div className="moderator-info">
                                    <span>Модератор: </span>
                                    <button
                                        className="moderator-link"
                                        onClick={() => handleModeratorClick(report.moderator_info!)}
                                    >
                                        {report.moderator_info.name} (@{report.moderator_info.username})
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </Block>
            ))}
        </>
    );
};

export default MyReports; 