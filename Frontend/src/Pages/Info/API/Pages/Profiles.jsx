import API from '../../../../Configs/API';
import { ApiCode } from '../../../../UIKit';

const Profiles = () => {
    return (
        <>
            <div className="BigText">
                Давайте научимся получать данные профиля, посты, для этого не обязательно быть авторизованным в аккаунт, но
                если авторизации нет, посты получить не получиться.
            </div>
            <div className="BigText">Вот пример кода который используется в веб версии Элемента:</div>
            <ApiCode
                code={API.Profile.GetProfile}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "data": {
    "id": 123,
    "type": 0,
    "name": "Иван Иванов",
    "username": "ivan",
    "description": "Программист, любитель кошек и хорошей музыки",
    "avatar": "https://elemsocial.com/files/avatars/123.jpg",
    "cover": "https://elemsocial.com/files/covers/123.jpg",
    "posts": 42,
    "subscribers": 156,
    "subscribed": 78,
    "create_date": "2024-05-12T10:15:30Z",
  }
}`}
            />
        </>
    );
};

export default Profiles;