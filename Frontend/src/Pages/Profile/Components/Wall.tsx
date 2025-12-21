import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { PreloadPosts } from '../../../System/UI/Preload';
import Post from '../../../Components/Post';
import AddPost from '../../../UIKit/Components/Layout/AddPost';

const Posts = ({ username, update }) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const [isLoading, setIsLoading] = useState(true);
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        wsClient.send({
            type: 'social',
            action: 'load_posts',
            payload: {
                posts_type: 'wall',
                username: username
            }
        }).then((data) => {
            setIsLoading(false);
            if (data.posts && data.posts.length > 0) {
                setPosts(data.posts);
            }
        })
    }, [update, username]);

    return (
        isLoading ? (
            <PreloadPosts />
        ) : (
            posts.length > 0 ? (
                posts.map((post: any) => (
                    <Post
                        key={`PID-${post.id}`}
                        post={post}
                    />
                ))
            ) : (
                <div className="UI-ErrorMessage">{t('ups')}</div>
            )
        )
    )
}

const Wall = ({ profileData }) => {
    const { t } = useTranslation();
    const [update, setUpdate] = useState(true);

    const onSend = () => {
        setUpdate(!update);
    }

    return (
        <>
            <AddPost
                onSend={onSend}
                inputPlaceholder={t('wall_input')}
                isWall={true}
                wallUsername={profileData?.username}
            />
            <Posts
                username={profileData?.username}
                update={update}
            />
        </>
    )
}

export default Wall;
