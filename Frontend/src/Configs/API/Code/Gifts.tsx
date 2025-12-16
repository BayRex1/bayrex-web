const LoadGifts = `wsClient.send({
  type: 'social',
  action: 'gifts/load',
  // Необязательно: username: 'UserName' для получения подарков конкретного пользователя
}).then((res) => {
  if (res.status === 'success') {
    // res.gifts содержит массив подарков
  } else {
    // Обработка ошибки
  }
});`;

const SendGift = `wsClient.send({
  type: 'social',
  action: 'gifts/send',
  payload: {
    username: 'UserName', // Получатель подарка
    gift_id: 123 // ID подарка
  }
}).then((res) => {
  if (res.status === 'success') {
    // Подарок отправлен успешно
  } else {
    // Обработка ошибки
  }
});`;

export default {
    LoadGifts,
    SendGift
} 