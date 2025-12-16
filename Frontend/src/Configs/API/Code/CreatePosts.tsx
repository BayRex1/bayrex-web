const CreateTextPost = `wsClient.send({
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
});`;

const CreateChannelPost = `wsClient.send({
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
});`;

const CreateImagePost = `// Подготовка файла изображения
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
});`;

const DeletePost = `wsClient.send({
  type: 'social',
  action: 'delete_post',
  pid: 123 // ID поста
}).then((res) => {
  if (res.status === 'success') {
    // Пост успешно удален
  } else {
    // Обработка ошибки
  }
});`;

const LikePost = `wsClient.send({
  type: 'social',
  action: 'like_post',
  pid: 123 // ID поста
}).then((res) => {
  if (res.status === 'success') {
    // Лайк успешно добавлен
  } else {
    // Обработка ошибки
  }
});`;

const UnlikePost = `wsClient.send({
  type: 'social',
  action: 'unlike_post',
  pid: 123 // ID поста
}).then((res) => {
  if (res.status === 'success') {
    // Лайк успешно удален
  } else {
    // Обработка ошибки
  }
});`;

const Repost = `wsClient.send({
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
});`;

export default {
    CreateTextPost,
    CreateChannelPost,
    CreateImagePost,
    DeletePost,
    LikePost,
    UnlikePost,
    Repost
} 