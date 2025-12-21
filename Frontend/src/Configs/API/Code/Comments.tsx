const LoadComments = `wsClient.send({
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
});`;

const AddComment = `wsClient.send({
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
});`;

const DeleteComment = `wsClient.send({
  type: 'social',
  action: 'delete_comment',
  cid: 456 // ID комментария
}).then((res) => {
  if (res.status === 'success') {
    // Комментарий успешно удален
  } else {
    // Обработка ошибки
  }
});`;

const LikeComment = `wsClient.send({
  type: 'social',
  action: 'like_comment',
  cid: 456 // ID комментария
}).then((res) => {
  if (res.status === 'success') {
    // Лайк успешно добавлен
  } else {
    // Обработка ошибки
  }
});`;

const UnlikeComment = `wsClient.send({
  type: 'social',
  action: 'unlike_comment',
  cid: 456 // ID комментария
}).then((res) => {
  if (res.status === 'success') {
    // Лайк успешно удален
  } else {
    // Обработка ошибки
  }
});`;

export default {
    LoadComments,
    AddComment,
    DeleteComment,
    LikeComment,
    UnlikeComment
} 
