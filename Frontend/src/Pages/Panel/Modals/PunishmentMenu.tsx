import { useState } from 'react';
import SocialInput from '../../../UIKit/Components/Inputs/SocialInput';
import Button from '../../../UIKit/Components/Buttons/Button';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useTranslation } from 'react-i18next';

const PunishmentMenu = ({ complaint, onClose, onApply }) => {
    const { wsClient } = useWebSocket();
    const { t } = useTranslation();
    
    const reasonTemplates = [
        'Спам в комментариях',
        'Нарушение правил сообщества',
        'Публикация неподходящего контента',
        'Оскорбление других пользователей',
        'Размещение рекламы без разрешения',
        'Нарушение авторских прав',
        'Троллинг и провокации',
        'Публикация ложной информации',
        'Флуд и бессмысленные сообщения',
        'Попытки обойти ограничения'
    ];
    
    const punishments = [
        { id: 'warn', name: t('moderation.punishments.warn'), desc: t('moderation.punishments.warn_desc') },
        { id: 'restrict_posts', name: t('moderation.punishments.restrict_posts'), desc: t('moderation.punishments.restrict_posts_desc') },
        { id: 'restrict_comments', name: t('moderation.punishments.restrict_comments'), desc: t('moderation.punishments.restrict_comments_desc') },
        { id: 'restrict_chat', name: t('moderation.punishments.restrict_chat'), desc: t('moderation.punishments.restrict_chat_desc') },
        { id: 'restrict_music', name: t('moderation.punishments.restrict_music'), desc: t('moderation.punishments.restrict_music_desc') },
        { id: 'ban', name: t('moderation.punishments.ban'), desc: t('moderation.punishments.ban_desc') }
    ];
    const [selectedPunishment, setSelectedPunishment] = useState('');
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState('24');
    const [deleteContent, setDeleteContent] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    
    const handleTemplateSelect = (template) => {
        setReason(template);
        setShowTemplates(false);
    };
    
    const handlePunish = async () => {
        try {
            if (deleteContent) {
                if (complaint.target_type === 'post') {
                    await wsClient.send({
                        type: 'social',
                        action: 'moderation/delete_post',
                        payload: { post_id: complaint.target_id }
                    });
                } else if (complaint.target_type === 'comment') {
                    await wsClient.send({
                        type: 'social',
                        action: 'moderation/delete_comment',
                        payload: { comment_id: complaint.target_id }
                    });
                }
            }

            if (selectedPunishment !== 'warn') {
                const payload: any = {
                    user_id: complaint.author_id || complaint.target_user_id,
                    punishment_type: selectedPunishment,
                    duration_hours: duration,
                    reason
                };
                
                if (complaint.id && complaint.id !== 0) {
                    payload.report_id = complaint.id;
                }
                
                const response = await wsClient.send({
                    type: 'social',
                    action: 'moderation/apply_punishment',
                    payload
                });
            }
            
            const text = `${punishments.find(p => p.id === selectedPunishment)?.name}. ${t('moderation.reason_label')} ${reason}` + 
                        (selectedPunishment !== 'ban' ? `. ${t('moderation.duration_label')} ${duration} ${t('hours_plural_2')}` : '') + 
                        (deleteContent ? `. ${t('moderation.delete_content')}` : '') + 
                        `. ${t('admin')}`;
        onApply(text);
        onClose();
        } catch (error) {
            console.error('Ошибка применения наказания:', error);
            alert(t('moderation.punishment_error'));
        }
    };
    return (
        <div className="UI-PunishmentMenu">
            <div className="Header">
                <h3>{t('moderation.punishment_menu_title')}</h3>
                <p>{t('moderation.user_label')} <strong>{complaint.author}</strong></p>
            </div>
            <div className="Options">
                {punishments.map(punishment => (
                    <label key={punishment.id} className="Option">
                        <input type="radio" name="punishment" value={punishment.id} checked={selectedPunishment === punishment.id} onChange={(e) => setSelectedPunishment(e.target.value)} />
                        <div className="Info">
                            <div className="Name">{punishment.name}</div>
                            <div className="Desc">{punishment.desc}</div>
                        </div>
                    </label>
                ))}
            </div>
            {selectedPunishment && selectedPunishment !== 'ban' && (
                <div className="DurationInput">
                    <label>{t('moderation.duration_label')}</label>
                    <SocialInput value={duration} onChange={(e) => setDuration(e.target.value)} placeholder={t('moderation.duration_placeholder')} maxLength={4} simple />
                </div>
            )}
            {(complaint.target_type === 'post' || complaint.target_type === 'comment') && (
                <div className="DeleteContentOption">
                    <label className="Option">
                        <input type="checkbox" checked={deleteContent} onChange={(e) => setDeleteContent(e.target.checked)} />
                        <div className="Info">
                            <div className="Name">{t('moderation.delete_content')}</div>
                            <div className="Desc">
                                {complaint.target_type === 'post' ? t('moderation.delete_post') : t('moderation.delete_comment')}
                            </div>
                        </div>
                    </label>
                </div>
            )}
            <div className="ReasonInput Unified-Text-Input-Container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label>{t('moderation.reason_label')}</label>
                    <button 
                        type="button"
                        className="UI-Button"
                        onClick={() => setShowTemplates(!showTemplates)}
                        style={{ 
                            fontSize: '12px', 
                            padding: '4px 8px',
                            background: showTemplates ? 'var(--ACCENT_COLOR)' : 'var(--BTN_BACKGROUND)',
                            color: showTemplates ? 'white' : 'var(--BTN_TEXT_COLOR)'
                        }}
                    >
                        {showTemplates ? 'Скрыть шаблоны' : 'Быстрые ответы'}
                    </button>
                </div>
                
                {showTemplates && (
                    <div style={{ 
                        marginBottom: '12px',
                        padding: '10px',
                        background: 'var(--BLOCK_BLOCK_COLOR)',
                        borderRadius: '8px',
                        border: '1px solid var(--BLOCK_SHADOW)'
                    }}>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: '6px' 
                        }}>
                            {reasonTemplates.map((template, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleTemplateSelect(template)}
                                    style={{
                                        padding: '6px 10px',
                                        background: 'var(--BLOCK_COLOR)',
                                        border: '1px solid var(--BTN_BACKGROUND)',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        color: 'var(--TEXT_COLOR)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        const target = e.target as HTMLButtonElement;
                                        target.style.background = 'var(--ACCENT_COLOR)';
                                        target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        const target = e.target as HTMLButtonElement;
                                        target.style.background = 'var(--BLOCK_COLOR)';
                                        target.style.color = 'var(--TEXT_COLOR)';
                                    }}
                                >
                                    {template}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <SocialInput 
                    value={reason} 
                    onChange={(e)=>setReason(e.target.value)} 
                    placeholder={t('moderation.reason_placeholder')} 
                    maxLength={300} 
                    simple 
                />
            </div>
            <div className="Actions">
                <Button title={t('moderation.apply_punishment')} onClick={handlePunish} isActive={!!selectedPunishment && !!reason.trim()} />
                <Button title={t('moderation.cancel')} onClick={onClose} buttonStyle="action" />
            </div>
        </div>
    );
};

export default PunishmentMenu; 
