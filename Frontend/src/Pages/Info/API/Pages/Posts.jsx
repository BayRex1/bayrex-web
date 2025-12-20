import API from '../../../../Configs/API';
import { ApiCode } from '../../../../UIKit';

const Posts = () => {
    return (
        <>
            <div className="BigText">
                Давайте научимся получать посты, чтобы это делать нам нужно войти в аккаунт,
                без аккаунта у вас просто не загрузит.
            </div>
            <div className="BigText">
                <h3>Получение постов</h3>
            </div>
            <ApiCode
                code={API.Posts.LoadPosts}
            />
            {/* хуйню ии сгенерила */}
            <div className="BigText">
                <h3>Получение одного поста</h3>
                Тут уже аккаунт не обязателен, так что пост загрузится и без него.
            </div>
            <ApiCode
                code={API.Posts.LoadPost}
            />
        </>
    );
};

export default Posts;