import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../System/Hooks/useAuth';
import { AnimateElement } from '../../System/Elements/Function';
import { I_ADD_FILE, I_CLOSE } from '../../System/UI/IconPack';
import { Block, Button, SendButton, TextInput } from '../../UIKit';
import { PreloadComments } from '../../System/UI/Preload';
import { useWebSocket } from '../../System/Context/WebSocket';
import CommentComponent from './Components/Comment';
import classNames from 'classnames';
import { HandleUserIcons } from '../../System/Elements/Handlers';
import { useModalsStore } from '../../Store/modalsStore';
import SubmitAppealModal from '../../Pages/Settings/Modals/SubmitAppealModal';

interface CommentsProps {
    postID: number;
    className?: string;
}

const Comments: React.FC<CommentsProps> = ({ postID, className }: CommentsProps) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const { accountData } = useAuth();
    const { openModal } = useModalsStore();
    const [commentsLoaded, setCommentsLoaded] = useState<Boolean>(false);
    const [comments, setComments] = useState<any>([]);
    const [sendLoading, setSendLoading] = useState<Boolean>(false);
    const fileRefs = useRef<any>({});
    const [commentFiles, setCommentFiles] = useState<any>([]);
    const [text, setText] = useState('');
    const [commentReply, setCommentReply] = useState<any>(null);

    const handleFilesInput = (e) => {
        setCommentFiles(e.target.files);
    };

    const loadComments = async () => {
        if (postID) {
            const res = await wsClient.send({
                type: 'social',
                action: 'comments/load',
                payload: {
                    post_id: postID
                }
            });

            return res.comments;
        }
    }

    useEffect(() => {
        if (commentsLoaded) {
            setCommentsLoaded(false);
        }
        loadComments().then(com => {
            setCommentsLoaded(true);
            setComments(com);
        })
    }, [postID]);

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const clipboardData = e.clipboardData;

        const text = clipboardData.getData('text/plain');
        if (text) {
            return;
        }

        if (clipboardData.files && clipboardData.files.length > 0) {
            e.preventDefault();
            setCommentFiles(clipboardData.files);
        }
    };

    const handleFileRemove = async (i) => {
        const updatedFiles = Array.from(commentFiles).filter((_, index) => index !== i);
        AnimateElement(fileRefs.current[i], 'FILE_INPUT-DELETE', 0.2);
        await new Promise((resolve) => setTimeout(resolve, 200));
        setCommentFiles(updatedFiles);
    };

    const loadFiles = async () => {
        const fileBuffers: any = [];

        for (let i = 0; i < commentFiles.length; i++) {
            const file = commentFiles[i];
            const buffer = await file.arrayBuffer();

            fileBuffers.push({
                name: file.name,
                buffer: new Uint8Array(buffer)
            });
        }

        return fileBuffers;
    };

    const sendComment = async () => {
        setSendLoading(true);

        const data = {
            type: 'social',
            action: 'comments/add',
            payload: {
                post_id: postID,
                files: await loadFiles(),
                text: text,
                reply_to: commentReply?.id || null
            }
        }

        wsClient.send(data).then((res: any) => {
            setSendLoading(false);
            if (res.status === 'success') {
                setText('');
                setCommentFiles([]);
                setCommentReply(null);
                loadComments().then(com => {
                    setComments(com);
                })
            } else if (res.status === 'error') {
                openModal({
                    type: 'alert',
                    props: {
                        title: t('error'),
                        message: res.message
                    }
                })
            }
        })
    };

    const handleReplyClick = (data) => {
        setCommentReply(data);
    };

    const handleCommentDelete = () => {
        loadComments().then(com => {
            setComments(com);
        })
    };

    return (
        <>
            {accountData?.id ? (
                <>
                    <div className={classNames('UI-PartitionName', className)}>{t('comments')}</div>
                    {!accountData?.permissions?.Comments ? (
                        <Block className="AddPost-Restricted">
                            <div className="AddPost-RestrictedMessage">
                                <div className="AddPost-RestrictedText">
                                    <div className="AddPost-RestrictedTitle">Написание комментариев ограничено</div>
                                    <div className="AddPost-RestrictedDesc">У вас нет прав на создание комментариев</div>
                                </div>
                                <Button
                                    title="Подать апелляцию"
                                    className="SubmitAppealButton"
                                    buttonStyle="action"
                                    onClick={() => {
                                        openModal({
                                            type: 'routed',
                                            props: {
                                                title: 'Подача апелляции',
                                                children: <SubmitAppealModal restrictionType="comments" />
                                            }
                                        });
                                    }}
                                />
                            </div>
                        </Block>
                    ) : (
                        <div className="Post-Add_comment" style={commentReply ? { borderRadius: 'var(--BR_BASE)' } : {}}>
                            {commentReply && (
                                <div
                                    style={{
                                        background: commentReply.aura
                                            ? commentReply.aura.replace('rgb', 'rgba').replace(')', ', 0.2)')
                                            : 'var(--REPLY_BG)'
                                    }}
                                    className="Reply"
                                >
                                    <div className="ReplyContent">
                                        <div
                                            className="Name"
                                            style={{
                                                color: commentReply.aura
                                                    ? commentReply.aura
                                                    : 'var(--ACCENT_COLOR)'
                                            }}
                                        >
                                            В ответ {commentReply.name}
                                            {commentReply.icons && (
                                                <HandleUserIcons icons={commentReply.icons} />
                                            )}
                                        </div>
                                        <div className="Text">{commentReply.text}</div>
                                    </div>
                                    <button
                                        className="Close"
                                        onClick={() => setCommentReply(null)}
                                        style={{
                                            fill: commentReply.aura
                                                ? commentReply.aura
                                                : 'var(--ACCENT_COLOR)'
                                        }}
                                    >
                                        <I_CLOSE />
                                    </button>
                                </div>
                            )}
                            <div className="Input">
                                <TextInput
                                    placeholder={t('comment_input')}
                                    value={text}
                                    onChange={(e) => { setText(e.target.value) }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            sendComment();
                                        }
                                    }}
                                    onPaste={handlePaste}
                                    maxLength={30000}
                                />
                                <input id="COMMENT-FILES_INPUT" type="file" multiple hidden onChange={handleFilesInput} />
                                <label htmlFor="COMMENT-FILES_INPUT" className="AddFile">
                                    <I_ADD_FILE />
                                </label>
                                <SendButton
                                    onClick={sendComment}
                                    isLoading={sendLoading}
                                    className=""
                                />
                            </div>
                        </div>
                    )}
                    <div style={{ width: '100%', position: 'relative' }}>
                        {commentFiles.length > 0 && (
                            <div
                                className="UI-UniversalPanel ELEMENT-SHOW"
                                style={{
                                    right: 0,
                                    animation: '0.2s ease 0s 1 normal forwards running ELEMENT-SHOW',
                                }}
                            >
                                {Array.from(commentFiles).map((file: any, i) => (
                                    <div
                                        key={file.name}
                                        ref={(el) => {
                                            fileRefs.current[i] = el;
                                        }}
                                        className="Item"
                                    >
                                        <div className="Name">{file.name}</div>
                                        <button className="Close" onClick={() => handleFileRemove(i)}>
                                            <I_CLOSE />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        {accountData?.id ? (
                            commentsLoaded ? (
                                Array.isArray(comments) && comments.length > 0 ? (
                                    comments.map((comment: any) => (
                                        <CommentComponent
                                            key={comment.id}
                                            comment={comment}
                                            onReplyClick={handleReplyClick}
                                            onDelete={handleCommentDelete}
                                            isInModal={true}
                                        />
                                    ))
                                ) : (
                                    <div className="UI-ErrorMessage">{t('comments_none')}</div>
                                )
                            ) : (
                                <PreloadComments />
                            )
                        ) : (
                            <div className="UI-ErrorMessage">{t('comments_account_warn')}</div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="UI-B_FIRST" style={{ height: '1px' }}></div>
                    <div className="UI-ErrorMessage">{t('comments_account_warn')}</div>
                </>
            )}
        </>
    );
};

export default Comments;