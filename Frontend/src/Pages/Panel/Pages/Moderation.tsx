import { useState, useEffect, useCallback, useMemo } from 'react';
import { Block, Button, Tabs } from '../../../UIKit';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';
import '../../../System/UI/Style.scss';
import '../../../System/UI/Moderation.scss';
import ComplaintDetail from '../Components/ComplaintDetail';
import ComplaintsListView from '../Components/ComplaintsList';
import ModerationHistory from '../Components/ModerationHistory';
import ModerationDashboard from '../Components/ModerationDashboard';
import AppealsReview from '../Components/AppealsReview';

const LoadingSpinner = () => (
    <div className="loading-spinner">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="15">
                <animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite" />
            </circle>
        </svg>
    </div>
);

const Moderation = () => {
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();

    const [categoryTab, setCategoryTab] = useState(0);
    const [statusTab, setStatusTab] = useState(0);

    const [complaints, setComplaints] = useState<any[]>([]);

    const [loadingReports, setLoadingReports] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = useCallback(async (status?: string) => {
        try {
            setLoadingReports(true);
            setError(null);

            const res = await wsClient.send({
                type: 'social',
                action: 'moderation/load_reports',
                payload: { status, limit: 100 }
            });

            if (res?.status === 'success' && res.reports) {
                setComplaints(res.reports);
                return res.reports;
            } else {
                throw new Error(res?.message || 'Ошибка загрузки жалоб');
            }
        } catch (err) {
            console.error('Ошибка загрузки жалоб:', err);
            setError('Не удалось загрузить жалобы');
            return [];
        } finally {
            setLoadingReports(false);
        }
    }, [wsClient]);

    const refreshData = useCallback(() => {
        fetchReports();
    }, [fetchReports]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const updateComplaintStatus = useCallback(async (complaintId: number, newStatus: string, resolution?: string) => {
        try {
            const res = await wsClient.send({
                type: 'social',
                action: 'moderation/update_report',
                payload: {
                    report_id: complaintId,
                    status: newStatus,
                    resolution
                }
            });

            if (res?.status === 'success') {
                setComplaints(prev => prev.map(c =>
                    c.id === complaintId ? {
                        ...c,
                        status: newStatus,
                        resolution,
                        updated_at: new Date().toISOString()
                    } : c
                ));

                if (newStatus === 'under_review') setStatusTab(1);
                if (newStatus === 'resolved') setStatusTab(2);
                if (newStatus === 'rejected') setStatusTab(3);

                return true;
            } else {
                throw new Error(res?.message || 'Ошибка обновления статуса');
            }
        } catch (error) {
            console.error('Ошибка при обновлении статуса жалобы:', error);
            setError('Не удалось обновить статус жалобы');
            return false;
        }
    }, [wsClient]);

    const openComplaint = useCallback((complaint) => {
        const mappedComplaint = {
            ...complaint,
            postId: complaint.target_type === 'post' ? complaint.target_id : null,
            commentId: complaint.target_type === 'comment' ? complaint.target_id : null,
            songId: complaint.target_type === 'music' ? complaint.target_id : null,
            target_username: complaint.target_type === 'user' ? (complaint.target_user?.username || complaint.target_username) : null,
            author: complaint.author?.username || complaint.author?.name || 'Неизвестен',
            author_id: complaint.target_user_id || complaint.author_id,
            reason: complaint.category,
            text: complaint.message,
            created: complaint.created_at
        };

        openModal({
            type: 'routed',
            props: {
                title: `Жалоба #${complaint.id} (${getStatusText(complaint.status)})`,
                children: (
                    <ComplaintDetail
                        complaint={mappedComplaint}
                        updateComplaintStatus={updateComplaintStatus}
                        setStatusTab={setStatusTab}
                    />
                ),
            }
        });
    }, [openModal, updateComplaintStatus]);

    const getStatusText = useCallback((status: string) => {
        switch (status) {
            case 'resolved': return 'Решена';
            case 'rejected': return 'Отклонена';
            case 'under_review': return 'На рассмотрении';
            case 'pending': return 'Не отвечена';
            default: return 'Неизвестно';
        }
    }, []);

    const statusTabs = useMemo(() => [
        {
            title: `Не отвечены (${complaints.filter(c => ['pending', 'unanswered'].includes(c.status)).length})`,
            content: (
                <div className="UI-Block moderation-content">
                    {loadingReports ? (
                        <div className="loading-container">
                            <LoadingSpinner />
                            <span>Загрузка жалоб...</span>
                        </div>
                    ) : (
                        <ComplaintsListView
                            complaints={complaints.filter(c => ['pending', 'unanswered'].includes(c.status))}
                            onSelect={openComplaint}
                        />
                    )}
                </div>
            )
        },
        {
            title: `На рассмотрении (${complaints.filter(c => c.status === 'under_review').length})`,
            content: (
                <div className="UI-Block moderation-content">
                    {loadingReports ? (
                        <div className="loading-container">
                            <LoadingSpinner />
                            <span>Загрузка жалоб...</span>
                        </div>
                    ) : (
                        <ComplaintsListView
                            complaints={complaints.filter(c => c.status === 'under_review')}
                            onSelect={openComplaint}
                        />
                    )}
                </div>
            )
        },
        {
            title: `Решены (${complaints.filter(c => c.status === 'resolved').length})`,
            content: (
                <div className="UI-Block moderation-content">
                    {loadingReports ? (
                        <div className="loading-container">
                            <LoadingSpinner />
                            <span>Загрузка жалоб...</span>
                        </div>
                    ) : (
                        <ComplaintsListView
                            complaints={complaints.filter(c => c.status === 'resolved')}
                            onSelect={openComplaint}
                        />
                    )}
                </div>
            )
        },
        {
            title: `Отклонены (${complaints.filter(c => c.status === 'rejected').length})`,
            content: (
                <div className="UI-Block moderation-content">
                    {loadingReports ? (
                        <div className="loading-container">
                            <LoadingSpinner />
                            <span>Загрузка жалоб...</span>
                        </div>
                    ) : (
                        <ComplaintsListView
                            complaints={complaints.filter(c => c.status === 'rejected')}
                            onSelect={openComplaint}
                        />
                    )}
                </div>
            )
        }
    ], [complaints, loadingReports, openComplaint]);

    const categories = useMemo(() => [
        {
            title: 'Дашборд',
            content: (
                <div className="moderation-content">
                    <ModerationDashboard />
                </div>
            )
        },
        {
            title: `Жалобы (${complaints.length})`,
            content: (
                <>
                    <Block className="moderation-header">
                        <Button
                            title="Обновить"
                            onClick={refreshData}
                            isActive={!loadingReports}
                        />
                    </Block>
                    <Tabs
                        tabs={statusTabs}
                        select={setStatusTab}
                    />
                    {statusTabs[statusTab].content}
                </>
            )
        },
        {
            title: 'Апелляции',
            content: (
                <Block className="moderation-content">
                    <AppealsReview />
                </Block>
            )
        },
        {
            title: 'История',
            content: (
                <div className="UI-Block moderation-content">
                    <ModerationHistory />
                </div>
            )
        },
    ], [
        complaints.length,
        statusTabs, statusTab, refreshData, loadingReports,
        openComplaint, error
    ]);

    return (
        <div className="ModerationPage">
            <Tabs
                tabs={categories} select={setCategoryTab}
                className="UI-B_FIRST"
            />
            {categories[categoryTab].content}
        </div>
    );
};

export default Moderation; 
