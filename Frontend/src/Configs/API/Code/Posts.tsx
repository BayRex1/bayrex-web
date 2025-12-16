const LoadPosts = `wsClient.send({
  type: 'social',
  action: 'load_posts',
  posts_type: 'last', // Тип постов (есть 'last', 'rec', 'subscribe')
  start_index: 0 // Начальный индекс (25, 50, 75 и тд)
}).then((res) => {
  if (res.status === 'success') {
      // Обработка постов
  } else if (res.status === 'error') {
      // Обработка ошибки
  }
});`;

const LoadPost = `wsClient.send({
  type: 'social',
  action: 'load_post',
  pid: 123 // Идентификатор поста
}).then((data: any) => {
  if (data.status === 'success') {
    // Обработка данных поста
  } else {
    handleError(data);
  }
});`;

export default {
    LoadPosts,
    LoadPost
}
