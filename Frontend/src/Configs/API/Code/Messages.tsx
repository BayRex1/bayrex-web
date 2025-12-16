const LoadChats = `wsClient.send({
  type: 'messenger',
  action: 'load_chats'
}).then((res) => {
  if (res.status === 'success') {
    // res.chats содержит массив чатов
    // Каждый чат имеет: target, avatar, name, last_message, last_message_date, notifications
  } else {
    // Обработка ошибки
  }
});`;

const LoadMessages = `wsClient.send({
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
});`;

const SendMessage = `const tempMid = Math.random().toString(36).substring(2, 15);

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
});`;

const ViewMessages = `wsClient.send({
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
});`;

const SendFile = `// Подготовка файла 
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
});`;

const DownloadFile = `wsClient.send({
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
});`;

const CreateChat = `wsClient.send({
  type: 'messenger',
  action: 'create_chat',
  target_id: 123 // ID пользователя
}).then((res) => {
  if (res.status === 'success') {
    // res.chat содержит информацию о созданном чате
  } else {
    // Обработка ошибки
  }
});`;

export default {
    LoadChats,
    LoadMessages,
    SendMessage,
    ViewMessages,
    SendFile,
    DownloadFile,
    CreateChat
} 