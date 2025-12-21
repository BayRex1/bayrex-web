import { I_REPORT, I_CHECKMARK, I_CLOCK, I_CLOSE, I_WARNING } from '../../../System/UI/IconPack';

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'resolved': return <I_CHECKMARK />;
        case 'rejected': return <I_CLOSE />;
        case 'under_review': return <I_CLOCK />;
        default: return <I_REPORT />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'resolved': return '#4CAF50';
        case 'rejected': return '#F44336';
        case 'under_review': return '#FF9800'
        default: return '#6b7280';
    }
};

const getStatusText = (status: string) => {
    switch (status) {
        case 'resolved': return 'Решена';
        case 'rejected': return 'Отклонена';
        case 'under_review': return 'На рассмотрении';
        case 'pending': return 'Ожидает';
        default: return 'Неизвестно';
    }
};

const getTargetTitle = (complaint: any) => {
    const { target_type, target_id } = complaint;
    
    switch (target_type) {
        case 'post': return `Пост #${target_id}`;
        case 'comment': return `Комментарий #${target_id}`;
        case 'music': return `Трек #${target_id}`;
        case 'user': return `Пользователь #${target_id}`;
        case 'channel': return `Канал #${target_id}`;
        default: return 'Контент';
    }
};

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'вчера';
        } else if (days < 7) {
            return `${days} дн. назад`;
        } else {
            return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        }
    } catch {
        return dateString;
    }
};

const getAuthorInfo = (author: any) => {
    if (typeof author === 'string') return author;
    if (author?.username) return `@${author.username}`;
    if (author?.name) return author.name;
    return 'Неизвестен';
};

type ComplaintsListProps = {
    complaints: any[];
    onSelect: (complaint: any) => void;
};

const ComplaintsList: React.FC<ComplaintsListProps> = ({ complaints, onSelect }) => {
    if (complaints.length === 0) {
        return (
            <div className="empty-state">
                <I_WARNING />
                <div style={{ fontSize: '1.2rem' }}>Жалоб нет</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: 5 }}>В этой категории пока нет жалоб для рассмотрения</div>
            </div>
        );
    }

    return (
        <>
            {complaints.map((complaint) => (
                <button
                    key={complaint.id} 
                    className="complaint-item" 
                    onClick={() => onSelect(complaint)}
                >
                    <div 
                        className="status-icon" 
                        style={{ color: getStatusColor(complaint.status) }}
                    >
                        {getStatusIcon(complaint.status)}
                    </div>
                    
                    <div className="complaint-content">
                        <div className="complaint-header">
                            <span>{getTargetTitle(complaint)}</span>
                            <span style={{ 
                                color: getStatusColor(complaint.status),
                                backgroundColor: `${getStatusColor(complaint.status)}15`
                            }}>
                                {getStatusText(complaint.status)}
                            </span>
                        </div>
                        
                        <div className="complaint-details">
                            <span>{complaint.category}</span>
                            {complaint.message && (
                                <span>
                                    — {complaint.message.length > 50 
                                        ? complaint.message.slice(0, 50) + '...' 
                                        : complaint.message}
                                </span>
                            )}
                        </div>
                        
                        <div className="complaint-meta">
                            <span>от {getAuthorInfo(complaint.author)}</span>
                            <span>•</span>
                            <span>{formatDate(complaint.created_at)}</span>
                            {complaint.updated_at && complaint.status !== 'pending' && (
                                <>
                                    <span>•</span>
                                    <span>обновлено {formatDate(complaint.updated_at)}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="complaint-id">
                        #{complaint.id}
                    </div>
                </button>
            ))}
        </>
    );
};

export default ComplaintsList; 
