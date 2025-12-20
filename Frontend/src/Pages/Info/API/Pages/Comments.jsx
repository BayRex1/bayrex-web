import API from '../../../../Configs/API';
import { ApiCode } from '../../../../UIKit';

const Comments = () => {
    return (
        <>
            <div className="BigText">
                Научимся работать с комментариями к постам. Для работы с комментариями необходимо быть авторизованным.
            </div>

            <div className="BigText">
                <h3>Получение комментариев к посту</h3>
                Для загрузки комментариев к посту:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'load_comments',
  pid: 123, // ID поста
  start_index: 0 // Начальный индекс (для загрузки большего количества комментариев)
}).then((res) => {
  if (res.status === 'success') {
    // res.comments содержит массив комментариев
  } else {
    // Обработка ошибки
  }
});`}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "comments": [
    {
      "cid": 456,
      "pid": 123,
      "uid": 789,
      "text": "Отличный пост!",
      "date": "2023-10-15T14:30:45Z",
      "likes": 5,
      "user_liked": true,
      "user": {
        "name": "Андрей Смирнов",
        "username": "andrey",
        "avatar": "https://elemsocial.com/files/avatars/789.jpg"
      }
    },
    {
      "cid": 457,
      "pid": 123,
      "uid": 101,
      "text": "Полностью согласен!",
      "date": "2023-10-15T15:12:22Z",
      "likes": 2,
      "user_liked": false,
      "user": {
        "name": "Елена Козлова",
        "username": "elena",
        "avatar": "https://elemsocial.com/files/avatars/101.jpg"
      }
    }
  ],
  "has_more": true
}`}
            />

            <div className="BigText">
                <h3>Отправка комментария</h3>
                Для отправки комментария к посту:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'add_comment',
  pid: 123, // ID поста
  text: 'Отличный пост!' // Текст комментария
}).then((res) => {
  if (res.status === 'success') {
    // Комментарий успешно добавлен
    // res.comment содержит информацию о добавленном комментарии
  } else {
    // Обработка ошибки
  }
});`}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "comment": {
    "cid": 458,
    "pid": 123,
    "uid": 456,
    "text": "Отличный пост!",
    "date": "2023-10-15T16:45:30Z",
    "likes": 0,
    "user_liked": false,
    "user": {
      "name": "Ваше Имя",
      "username": "your_username",
      "avatar": "https://elemsocial.com/files/avatars/456.jpg"
    }
  }
}`}
            />

            <div className="BigText">
                <h3>Удаление комментария</h3>
                Для удаления своего комментария:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'delete_comment',
  cid: 456 // ID комментария
}).then((res) => {
  if (res.status === 'success') {
    // Комментарий успешно удален
  } else {
    // Обработка ошибки
  }
});`}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "cid": 456
}`}
            />

            <div className="BigText">
                <h3>Лайк комментария</h3>
                Для добавления лайка к комментарию:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'like_comment',
  cid: 456 // ID комментария
}).then((res) => {
  if (res.status === 'success') {
    // Лайк успешно добавлен
  } else {
    // Обработка ошибки
  }
});`}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "cid": 456,
  "likes": 6
}`}
            />

            <div className="BigText">
                <h3>Отмена лайка комментария</h3>
                Для удаления лайка с комментария:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'unlike_comment',
  cid: 456 // ID комментария
}).then((res) => {
  if (res.status === 'success') {
    // Лайк успешно удален
  } else {
    // Обработка ошибки
  }
});`}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "cid": 456,
  "likes": 5
}`}
            />
        </>
    );
};

export default Comments; 