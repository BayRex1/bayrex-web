const ChangeName = `const changeName = () => {
  wsClient.send({
    type: 'social',
    action: 'change_profile/name',
    name: 'Хароми' // Новое имя
  }).then((res) => {
    if (res.status === 'success') {
      updateData();
    } else {
      showError(res);
    }
  })
};`;

const ChangeEmail = `const changeEmail = () => {
  wsClient
    .send({
      type: 'social',
      action: 'change_profile/email',
      email: 'xaromie@anon.onion', // Новая почта
    })
    .then((res) => {
      if (res.status === 'success') {
        updateData();
      } else {
        showError(res);
      }
    });
};`;

const ChangePassword = `const changeEmail = () => {
  wsClient
    .send({
      type: 'social',
      action: 'change_profile/password',
      old_password: '123', // Старый пароль
      new_password: '12345' // Новый пароль
    })
    .then((res) => {
      if (res.status === 'success') {
        updateData();
      } else {
        showError(res);
      }
    });
};`;

const ChangeUsername = `const changeUsername = () => {
  wsClient
    .send({
      type: 'social',
      action: 'change_profile/username',
      username: 'qwerty1', // Новое уникальное имя
    })
    .then((res) => {
      if (res.status === 'success') {
        updateData();
      } else {
        showError(res);
      }
    });
};`;

const ChangeDescription = `const changeDescription = () => {
  wsClient
    .send({
      type: 'social',
      action: 'change_profile/description',
      description: 'Всем привет! это канал...', // Новое описание
    })
    .then((res) => {
      if (res.status === 'success') {
        updateData();
      } else {
        showError(res);
      }
    });
};`;

const ChangeCover = `wsClient.send({
  type: 'social',
  action: 'change_profile/cover/upload',
  file: new Uint8Array([]), // Файл в формате Unit8Array
}).then((res) => {
  if (res.status === 'success') {
      updateData();
  } else {
      showError(res);
  }
})`;

const ChangeAvatar = `wsClient.send({
  type: 'social',
  action: 'change_profile/avatar/upload',
  file: new Uint8Array([]), // Файл в формате Unit8Array
}).then((res) => {
  if (res.status === 'success') {
      updateData();
  } else {
      showError(res);
  }
})`;

export default {
    ChangeName,
    ChangeEmail,
    ChangePassword,
    ChangeUsername,
    ChangeDescription,
    ChangeCover,
    ChangeAvatar
}