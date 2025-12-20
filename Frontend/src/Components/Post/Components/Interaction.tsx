import { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../System/Hooks/useAuth';
import { I_DISLIKE, I_LIKE } from '../../../System/UI/IconPack';
import { useWebSocket } from '../../../System/Context/WebSocket';
import classNames from 'classnames';

interface InteractionProps {
    likes: number;
    liked: boolean;
    dislikes: number;
    disliked: boolean;
    pid: string | number;
    onLike?: () => void;
    onDislike?: () => void;
}

const Interaction: React.FC<InteractionProps> = memo(({ likes, liked, dislikes, disliked, pid, onLike, onDislike }) => {
    const { t } = useTranslation();
    const { accountData } = useAuth();
    const { wsClient } = useWebSocket();

    const [likesCount, setLikesCount] = useState(likes);
    const [isLiked, setIsLiked] = useState(liked);
    const [dislikesCount, setDislikesCount] = useState(dislikes);
    const [isDisliked, setIsDisliked] = useState(disliked);

    useEffect(() => {
        setLikesCount(likes);
        setIsLiked(liked);
    }, [likes, liked]);

    useEffect(() => {
        setDislikesCount(dislikes);
        setIsDisliked(disliked);
    }, [dislikes, disliked]);

    // Лайк
    const like = useCallback(() => {
        if (accountData && accountData.id) {
            setIsLiked((prevIsLiked) => {
                if (prevIsLiked) {
                    setLikesCount((prevLikesCount) => Math.max(prevLikesCount - 1, 0));
                    return false;
                } else {
                    setLikesCount((prevLikesCount) => prevLikesCount + 1);
                    if (isDisliked) {
                        setDislikesCount((prevDislikesCount) => Math.max(prevDislikesCount - 1, 0));
                        setIsDisliked(false);
                    }
                    return true;
                }
            });

            if (onLike) {
                onLike();
            } else {
                wsClient.send({
                    type: 'social',
                    action: 'posts/like',
                    payload: {
                        post_id: pid
                    }
                });
            }
        }
    }, [accountData, isDisliked, onLike, pid]);

    // Дизлайк
    const dislike = useCallback(() => {
        if (accountData && accountData.id) {
            setIsDisliked((prevIsDisliked) => {
                if (prevIsDisliked) {
                    setDislikesCount((prevDislikesCount) => Math.max(prevDislikesCount - 1, 0));
                    return false;
                } else {
                    setDislikesCount((prevDislikesCount) => prevDislikesCount + 1);
                    if (isLiked) {
                        setLikesCount((prevLikesCount) => Math.max(prevLikesCount - 1, 0));
                        setIsLiked(false);
                    }
                    return true;
                }
            });

            if (onDislike) {
                onDislike();
            } else {
                wsClient.send({
                    type: 'social',
                    action: 'posts/dislike',
                    payload: {
                        post_id: pid
                    }
                });
            }
        }
    }, [accountData, isLiked, onDislike, pid]);

    return (
        <>
            <button
                onClick={like}
                className={classNames('InteractionButton', 'Like', {
                    Liked: isLiked,
                })}
            >
                <I_LIKE />
                {likesCount > 0 && (
                    <div style={{ marginLeft: 5 }}>{likesCount}</div>
                )}
            </button>

            <button
                onClick={dislike}
                className={classNames('InteractionButton', 'Dislike', {
                    Liked: isDisliked,
                })}
            >
                <I_DISLIKE />
                {dislikesCount > 0 && (
                    <div style={{ marginLeft: 5 }}>{dislikesCount}</div>
                )}
            </button>
        </>
    );
});

export default Interaction;
