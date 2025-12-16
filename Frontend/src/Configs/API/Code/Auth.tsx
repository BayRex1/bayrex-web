;const Authorize = `const authorize = (data) => {
  if (data.status === 'success') {
    wsClient
      .send({
        type: 'authorization',
        action: 'connect',
        S_KEY: data.S_KEY, // Ключ сессии
      })
      .then((res) => {
        if (res.status === 'success') {
          // Это логика которая реализована в браузерной версии Элемента, у вас может быть другая
          addAccount(res.accountData, data.S_KEY);
          setSocketAuthorized(true);
          navigate('/');
        }
      });
  } else if (data.status === 'error') {
    openModal({
      type: 'info',
      title: 'Ошибка',
      text: data.message,
    });
  }
};`;

const Login = `const data = {
  type: 'social',
  action: 'auth/login',
  email: 'user@mail.com', // Почта
  password: 'qwerty123', // Пароль
  device_type: 'browser', // Тип устройства (есть 'browser', 'android_app', 'ios_app', 'windows_app')
  device: 'Element Web 2.5', // Ваш клиент, можно вписать любое название
};

wsClient.send(data).then((res) => {
  authorize(res);
});`;

const Reg = `const data = {
  type: 'social',
  action: 'auth/reg',
  name: 'BayRex', // Имя
  username: 'bayrex', // Уникальное имя
  email: 'bayrex@epic.com', // Почта
  password: 'qwerty1230', // Пароль
  accept: true, // Принимаем правила
  h_captcha: 'TOKEN..', // Токен после прохождения капчи
};

wsClient.send(data).then((res) => {
  authorize(res);
});`;

export default {
  Authorize,
  Login,
  Reg,
};