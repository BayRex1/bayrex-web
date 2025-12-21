import { useState } from 'react';
import SocialInput from '../../../UIKit/Components/Inputs/SocialInput';
import Button from '../../../UIKit/Components/Buttons/Button';
import { useTranslation } from 'react-i18next';

const RejectModal = ({ complaint, onClose, onReject }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const handleReject = () => {
        onReject(reason);
        onClose();
    };
    return (
        <div className="UI-PunishmentMenu">
            <div className="Header"><h3>{t('moderation.reject_complaint')}</h3></div>
            <div className="ReasonInput Unified-Text-Input-Container" style={{ marginTop: 12 }}>
                <label>{t('moderation.reject_reason')}</label>
                <SocialInput placeholder={t('moderation.reject_placeholder')} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} simple />
            </div>
            <div className="Actions">
                <Button title={t('moderation.reject_button')} onClick={handleReject} isActive={!!reason.trim()} className="review-btn" />
                <Button title={t('moderation.cancel')} onClick={onClose} buttonStyle="action" className="admin-btn" />
            </div>
        </div>
    );
};

export default RejectModal; 
