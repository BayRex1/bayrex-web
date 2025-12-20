import { useEffect, useState } from 'react';
import { useWebSocket } from '../../System/Context/WebSocket';
import HandlePost from '../Post';
import { PreloadPost } from '../../System/UI/Preload';
import Comments from '../Comments';
import { useTranslation } from 'react-i18next';

interface PostModalProps {
  postID: string;
}

const PostModal = ({ postID }: PostModalProps) => {
  const { t } = useTranslation();
  const { wsClient } = useWebSocket();
  const [postLoaded, setPostLoaded] = useState<boolean>(false);
  const [post, setPost] = useState<any>('');

  useEffect(() => {
    if (!postID) return;

    wsClient.send({
      type: 'social',
      action: 'load_post',
      pid: postID
    }).then((res: any) => {
      if (res.status === 'success') {
        const post = res.post;
        if (post?.id) {
          setPost(post);
        }
      }
      setPostLoaded(true);
    })
  }, [postID]);

  useEffect(() => {
    if (postLoaded) {
      setPostLoaded(false);
    }
  }, [postID]);

  return (
    <>
      {(postLoaded && !post.id) ? (
        <div className="PostModal-Error">{t('error')}</div>
      ) : (
        <>
          {postLoaded ? (
            <HandlePost
              post={post}
              isInModal={true}
            />
          ) : (
            <PreloadPost className="UI-B_FIRST" />
          )}

          <div className="PostModal-Comments">
            <Comments
              postID={post.id}
            />
          </div>
        </>
      )}
    </>
  );
};

export default PostModal; 
