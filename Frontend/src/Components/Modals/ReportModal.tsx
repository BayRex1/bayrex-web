import { useState } from 'react';
import { Block, Button, ListButtons, PartitionName } from '../../UIKit/index';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../System/Context/WebSocket';
import '../../System/UI/ReportModal.scss';
import { useModalsStore } from '../../Store/modalsStore';
import SocialInput from '../../UIKit/Components/Inputs/SocialInput';
import { LineSpinner } from 'ldrs/react';
import Post from '../Post';
import CommentComponent from '../Comments/Components/Comment';

const getReasons = (targetType: string) => {
    if (targetType === 'music') {
        return [
            {
                key: 'meaningless_content',
                category: 'Файл не несёт смысла'
            },
            {
                key: 'other',
                category: 'Другое'
            },
        ];
    }

    if (targetType === 'user') {
        return [
            {
                key: 'spam',
                category: 'Спам'
            },
            {
                key: 'animal_cruelty',
                category: 'Жестокое обращение с животными'
            },
            {
                key: 'child_porn',
                category: 'Детская порнография'
            },
            {
                key: 'weapon_sales',
                category: 'Продажа оружия'
            },
            {
                key: 'drug_sales',
                category: 'Продажа наркотиков'
            },
            {
                key: 'personal_data_without_consent',
                category: 'Персональные данные без согласия'
            },
            {
                key: 'other',
                category: 'Другое'
            },
        ];
    }

    return [
        {
            key: 'spam',
            category: 'Спам'
        },
        {
            key: 'animal_cruelty',
            category: 'Жестокое обращение с животными'
        },
        {
            key: 'child_porn',
            category: 'Детская порнография'
        },
        {
            key: 'weapon_sales',
            category: 'Продажа оружия'
        },
        {
            key: 'drug_sales',
            category: 'Продажа наркотиков'
        },
        {
            key: 'personal_data_without_consent',
            category: 'Персональные данные без согласия'
        },
        {
            key: 'other',
            category: 'Другое'
        },
    ];
};

type Props = {
    targetType: 'post' | 'comment' | 'user' | 'music' | 'channel';
    targetId: number | string;
    target?: any;
    onClose?: () => void;
};

const ReportModal = ({ targetType, targetId, target, onClose }: Props) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();

    const [selectedReason, setSelectedReason] = useState<{
        key: string;
        category: string;
        description: string;
    } | null>(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'select' | 'comment'>('select');

    const handleReasonSelect = (reason: {
        key: string;
        category: string;
        description: string;
    }) => {
        setSelectedReason(reason);
        setStep('comment');
    };

    const handleBackToSelect = () => {
        setStep('select');
        setSelectedReason(null);
        setComment('');
    };

    const sendReport = async () => {
        if (!selectedReason || loading) return;

        setLoading(true);

        try {
            const res = await wsClient.send({
                type: 'social',
                action: 'moderation/send_report',
                payload: {
                    target_type: targetType,
                    target_id:
                        typeof targetId === 'string' ? parseInt(targetId) : targetId,
                    category: selectedReason.key,
                    message: comment || `Жалоба: ${selectedReason.description}`,
                },
            });

            if (res?.status === 'success') {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('success'),
                        message: t('moderation.report_sent_success'),
                    },
                });
                onClose?.();
            } else {
                throw new Error(res?.message || t('moderation.unknown_error'));
            }
        } catch (error: any) {
            openModal({
                type: 'alert',
                props: {
                    title: t('error'),
                    message: error?.message || t('moderation.report_error'),
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredReasons = getReasons(targetType);

    return (
        <div className='ReportModal'>
            {targetType === 'post' && (
                <Post
                    post={target}
                    governButtons={false}
                />
            )}
            {targetType === 'comment' && (
                <CommentComponent
                    comment={target}
                    governButtons={false}
                />
            )}

            {loading && (
                <div
                    style={{
                        margin: 'auto',
                        width: 'fit-content',
                    }}
                >
                    <LineSpinner
                        size="35"
                        stroke="2"
                        speed="1"
                        color="var(--TEXT_COLOR)"
                    />
                </div>
            )}

            {!loading && step === 'select' && (
                <>
                    <PartitionName name={t('report_reason_question')} />
                    <ListButtons
                        buttons={filteredReasons.map((reason: any) => ({
                            title: reason.category,
                            onClick: () => handleReasonSelect(reason),
                        }))}
                    />
                </>
            )}

            {!loading && step === 'comment' && selectedReason && (
                <>
                    <PartitionName
                        name={`${t('report_title')}: ${selectedReason.category}`}
                    />
                    <div className='ReportDetails'>
                        <Block>
                            <div
                                style={{ marginBottom: '12px', fontSize: 14, opacity: 0.8 }}
                            >
                                {selectedReason.key === 'other'
                                    ? 'Опишите проблему подробнее (обязательно):'
                                    : 'Дополнительное описание проблемы (необязательно):'}
                            </div>
                            <SocialInput
                                placeholder={
                                    selectedReason.key === 'other'
                                        ? 'Опишите проблему...'
                                        : 'Дополнительная информация...'
                                }
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={500}
                            />
                            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 8 }}>
                                {comment.length}/500 символов
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <Button
                                    title={t('back')}
                                    onClick={handleBackToSelect}
                                    buttonStyle='secondary'
                                    style={{ flex: 1 }}
                                    data-style='secondary'
                                />
                                <Button
                                    title={t('send')}
                                    onClick={sendReport}
                                    isActive={
                                        selectedReason.key !== 'other' || comment.trim().length > 0
                                    }
                                    buttonStyle='action'
                                    style={{ flex: 2 }}
                                    data-style='action'
                                />
                            </div>
                        </Block>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportModal;
