import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { PreloadPost } from '../System/UI/Preload';
import ErrorPage from './ErrorPage';
import { useWebSocket } from '../System/Context/WebSocket';
import { TopBar } from '../Components/Navigate';
import { useAuth } from '../System/Hooks/useAuth';
import HandlePost from '../Components/Post';
import Comments from '../Components/Comments';

const Post = () => {
  const { wsClient } = useWebSocket();
  const { accountData } = useAuth();
  const params = useParams();
  const [postLoaded, setPostLoaded] = useState<boolean>(false);
  const [post, setPost] = useState<any>('');

  useEffect(() => {
    wsClient.send({
      type: 'social',
      action: 'load_post',
      pid: params.id
    }).then((res: any) => {
      if (res.status === 'success') {
        const post = res.post;
        if (post?.id) {
          setPost(post);
        }
      }
      setPostLoaded(true);
    })
  }, [params.id, wsClient, accountData]);

  return (
    <>
      <TopBar search={true} />
      <div className="Content Post-Page">
        {(postLoaded && !post.id) ? (
          <ErrorPage />
        ) : (
          <>
            <div className="UI-C_L">
              <div className="UI-ScrollView">
                {postLoaded ? (
                  <HandlePost
                    post={post}
                    className="UI-B_FIRST"
                    profileData={null}
                    onDelete={() => { }}
                  />
                ) : (
                  <PreloadPost className="UI-B_FIRST" />
                )}
              </div>
            </div>
            <div className="UI-C_R Post-Comments">
              <div className="UI-ScrollView">
                <Comments
                  postID={post.id}
                  className="UI-B_FIRST"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Post;
