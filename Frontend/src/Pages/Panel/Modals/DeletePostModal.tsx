import { useState } from 'react';
import SocialInput from '../../../UIKit/Components/Inputs/SocialInput';
import Button from '../../../UIKit/Components/Buttons/Button';
import { useTranslation } from 'react-i18next';

const DeletePostModal = ({ post, onClose, onConfirm }) => {
    const { t } = useTranslation();
    
    const deleteReasons = [
        { key: 'spam', label: t('moderation.delete_reasons.spam') },
        { key: 'illegal', label: t('moderation.delete_reasons.illegal') },
        { key: 'animal', label: t('moderation.delete_reasons.animal') },
        { key: 'child', label: t('moderation.delete_reasons.child') },
        { key: 'weapon', label: t('moderation.delete_reasons.weapon') },
        { key: 'drug', label: t('moderation.delete_reasons.drug') },
        { key: 'other', label: t('moderation.delete_reasons.other') }
    ];
    const [selected, setSelected] = useState('');
    const [comment, setComment] = useState('');
    const handleConfirm = () => {
        const label = deleteReasons.find(r => r.key === selected)?.label || '';
        onConfirm(label + (comment ? ` | ${comment}` : ''));
        onClose();
    };
    return (
        <div className="UI-PunishmentMenu">
            <div className="Header"><h3>{t('moderation.delete_post_title')}</h3></div>
            <div className="Options">
                {deleteReasons.map(r => (
                    <label key={r.key} className="Option">
                        <input type="radio" value={r.key} checked={selected === r.key} onChange={e => setSelected(e.target.value)} />
                        <div className="Info"><div className="Name">{r.label}</div></div>
                    </label>
                ))}
            </div>
            {selected === 'other' && (
                <div className="ReasonInput Unified-Text-Input-Container"><label>{t('moderation.reason_label')}</label><SocialInput value={comment} onChange={e => setComment(e.target.value)} simple /></div>
            )}
            <div className="Actions">
                <Button title={t('moderation.delete_post_button')} onClick={handleConfirm} isActive={!!selected} className="danger" />
                <Button title={t('moderation.cancel')} onClick={onClose} buttonStyle="action" className="admin-btn" />
            </div>
        </div>
    );
};

export default DeletePostModal; 
