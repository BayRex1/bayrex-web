import { ApiCode } from '../../../../UIKit';

const CreatePosts = () => {
    return (
        <>
            <div className="BigText">
                Научимся создавать и управлять постами. Для работы с постами необходимо быть авторизованным.
            </div>

            <div className="BigText">
                <h3>Создание текстового поста</h3>
                Для создания простого текстового поста:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'create_post',
  text: 'Мой новый пост в Элементе!', // Текст поста
  source_type: 0 // 0 - пост от имени пользователя, 1 - пост от имени канала
}).then((res) => {
  if (res.status === 'success') {
    // Пост успешно создан
    // res.pid содержит ID созданного поста
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
  "pid": 12345,
  "date": "2023-10-15T14:30:45Z"
}`}
            />

            <div className="BigText">
                <h3>Создание поста от имени канала</h3>
                Для создания поста от имени канала:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'create_post',
  text: 'Пост от имени моего канала', // Текст поста
  source_type: 1, // 1 - пост от имени канала
  source_id: 123 // ID канала, от имени которого создается пост
}).then((res) => {
  if (res.status === 'success') {
    // Пост успешно создан
    // res.pid содержит ID созданного поста
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
  "pid": 12346,
  "date": "2023-10-15T15:20:10Z",
  "source_type": 1,
  "source_id": 123
}`}
            />

            <div className="BigText">
                <h3>Создание поста с изображением</h3>
                Для создания поста с изображением:
            </div>
            <ApiCode
                code={`// Подготовка файла изображения
const image = new Uint8Array([]); // Бинарные данные изображения

wsClient.send({
  type: 'social',
  action: 'create_post',
  text: 'Пост с изображением', // Текст поста (может быть пустым)
  source_type: 0, // 0 - пост от имени пользователя
  attachment: {
    type: 'image',
    file: image // Бинарные данные изображения
  }
}).then((res) => {
  if (res.status === 'success') {
    // Пост с изображением успешно создан
    // res.pid содержит ID созданного поста
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
  "pid": 12347,
  "date": "2023-10-15T16:45:22Z",
  "attachments": [
    {
      "type": "image",
      "url": "https://elemsocial.com/files/posts/12347/image.jpg",
      "width": 1200,
      "height": 800
    }
  ]
}`}
            />

            <div className="BigText">
                <h3>Удаление поста</h3>
                Для удаления своего поста:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'delete_post',
  pid: 123 // ID поста
}).then((res) => {
  if (res.status === 'success') {
    // Пост успешно удален
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
  "pid": 123
}`}
            />

            <div className="BigText">
                <h3>Лайк поста</h3>
                Для добавления лайка к посту:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'like_post',
  pid: 123 // ID поста
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
  "pid": 123,
  "likes": 42
}`}
            />

            <div className="BigText">
                <h3>Отмена лайка поста</h3>
                Для удаления лайка с поста:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'unlike_post',
  pid: 123 // ID поста
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
  "pid": 123,
  "likes": 41
}`}
            />

            <div className="BigText">
                <h3>Репост</h3>
                Для создания репоста:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'social',
  action: 'repost',
  pid: 123, // ID поста для репоста
  text: 'Мой комментарий к репосту', // Дополнительный текст (может быть пустым)
  source_type: 0 // 0 - от имени пользователя, 1 - от имени канала
}).then((res) => {
  if (res.status === 'success') {
    // Репост успешно создан
    // res.pid содержит ID созданного репоста
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
  "pid": 12348,
  "date": "2023-10-15T18:30:15Z",
  "original_post": {
    "pid": 123,
    "text": "Оригинальный пост",
    "author": {
      "name": "Автор поста",
      "username": "username",
      "avatar": "https://elemsocial.com/files/avatars/789.jpg"
    }
  }
}`}
            />
        </>
    );
};

export default CreatePosts; 