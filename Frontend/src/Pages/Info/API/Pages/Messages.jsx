import API from '../../../../Configs/API';
import { ApiCode } from '../../../../UIKit';

const Messages = () => {
    return (
        <>
            <div className="BigText">
                Давайте научимся работать с сообщениями в мессенджере. Для работы с сообщениями необходимо быть авторизованным.
            </div>

            <div className="BigText">
                <h3>Получение списка чатов</h3>
                Получение списка всех чатов пользователя:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'messenger',
  action: 'load_chats'
}).then((res) => {
  if (res.status === 'success') {
    // res.chats содержит массив чатов
    // Каждый чат имеет: target, avatar, name, last_message, last_message_date, notifications
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
  "chats": [
    {
      "target": {
        "id": 123,
        "type": 0
      },
      "avatar": "https://elemsocial.com/files/avatars/123.jpg",
      "name": "Иван Иванов",
      "last_message": "Привет, как дела?",
      "last_message_date": "2023-10-15T14:30:45Z",
      "notifications": 2
    },
    {
      "target": {
        "id": 456,
        "type": 0
      },
      "avatar": "https://elemsocial.com/files/avatars/456.jpg",
      "name": "Анна Петрова",
      "last_message": "Увидимся завтра!",
      "last_message_date": "2023-10-14T18:22:10Z",
      "notifications": 0
    }
  ]
}`}
            />

            <div className="BigText">
                <h3>Загрузка сообщений чата</h3>
                Для загрузки сообщений конкретного чата:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'messenger',
  action: 'load_messages',
  target: {
    id: 123, // ID чата
    type: 0 // Тип чата (0 - личный чат, 1 - групповой чат)
  },
  start_index: 0 // Начальный индекс (для загрузки более старых сообщений)
}).then((res) => {
  if (res.status === 'success') {
    // res.messages содержит массив сообщений
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
  "messages": [
    {
      "mid": 789,
      "from_id": 456,
      "text": "Привет, как дела?",
      "date": "2023-10-15T14:30:45Z",
      "read": true
    },
    {
      "mid": 790,
      "from_id": 123,
      "text": "Все хорошо, спасибо!",
      "date": "2023-10-15T14:32:15Z",
      "read": true
    }
  ],
  "has_more": true
}`}
            />

            <div className="BigText">
                <h3>Отправка текстового сообщения</h3>
                Отправка простого текстового сообщения:
            </div>
            <ApiCode
                code={`const tempMid = Math.random().toString(36).substring(2, 15);

wsClient.send({
  type: 'messenger',
  action: 'send_message',
  target: {
    id: 123, // ID чата
    type: 0 // Тип чата
  },
  temp_mid: tempMid, // Временный ID сообщения до получения реального
  message: 'Привет, как дела?' // Текст сообщения
}).then((res) => {
  if (res.status === 'success') {
    // Сообщение успешно отправлено
    // res.mid содержит реальный ID сообщения
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
  "mid": 791,
  "temp_mid": "gk8aj3n6d5h2",
  "date": "2023-10-15T15:40:12Z"
}`}
            />

            <div className="BigText">
                <h3>Отметка о прочтении</h3>
                Отметка о прочтении сообщений в чате:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'messenger',
  action: 'view_messages',
  target: {
    id: 123, // ID чата
    type: 0 // Тип чата
  }
}).then((res) => {
  if (res.status === 'success') {
    // Сообщения отмечены как прочитанные
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
  "status": "success"
}`}
            />

            <div className="BigText">
                <h3>Отправка файла</h3>
                Для отправки файла в чат:
            </div>
            <ApiCode
                code={`// Подготовка файла 
const file = new Uint8Array([]); // Бинарные данные файла
const fileName = 'document.pdf';

wsClient.send({
  type: 'messenger',
  action: 'send_message',
  target: {
    id: 123, // ID чата
    type: 0 // Тип чата
  },
  file: file, // Бинарные данные файла
  file_name: fileName, // Имя файла
  temp_mid: Math.random().toString(36).substring(2, 15) // Временный ID сообщения
}).then((res) => {
  if (res.status === 'success') {
    // Файл успешно отправлен
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
  "mid": 792,
  "temp_mid": "lk9fr4c7a2e8",
  "date": "2023-10-15T16:05:30Z",
  "file": {
    "name": "document.pdf",
    "size": 245678,
    "type": "application/pdf",
    "file_map": [1, 2, 3] // Массив идентификаторов частей файла
  }
}`}
            />

            <div className="BigText">
                <h3>Скачивание файла</h3>
                Для скачивания файла из сообщения:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'messenger',
  action: 'download_file',
  mid: 123456, // ID сообщения с файлом
  file_id: 1 // ID части файла (из file_map)
}).then((res) => {
  if (res.status === 'success') {
    // res.binary содержит бинарные данные части файла
    // Необходимо скачать все части (file_map) и объединить их
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
  "mid": 123456,
  "file_id": 1,
  "binary": Uint8Array([...]), // Бинарные данные части файла
  "total_parts": 3
}`}
            />

            <div className="BigText">
                <h3>Создание нового чата</h3>
                Для создания нового личного чата с пользователем:
            </div>
            <ApiCode
                code={`wsClient.send({
  type: 'messenger',
  action: 'create_chat',
  target_id: 123 // ID пользователя
}).then((res) => {
  if (res.status === 'success') {
    // res.chat содержит информацию о созданном чате
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
  "chat": {
    "target": {
      "id": 123,
      "type": 0
    },
    "avatar": "https://elemsocial.com/files/avatars/123.jpg",
    "name": "Иван Иванов",
    "last_message": "",
    "last_message_date": "2023-10-15T17:20:00Z",
    "notifications": 0
  }
}`}
            />
        </>
    );
};

export default Messages; 