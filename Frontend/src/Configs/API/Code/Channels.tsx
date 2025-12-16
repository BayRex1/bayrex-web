const Create = `const create = () => {
  setIsLoading(true);

  let data: any = {
    type: 'social',
    action: 'channels/create',
    name: 'Хароми', // Имя канала (обязательно)
    username: 'уникальное_имя21', // Уникальное имя (обязательно)
  };

  if (cover) {
    data.cover = cover; // Обложка в Unit8Array
  }
  if (avatar) {
    data.avatar = avatar; // Аватар в Unit8Array
  }
  if (description) {
    data.description = description; // Описание
  }

  wsClient.send(data).then((res) => {
    setIsLoading(false);

    if (res.status === 'success') {
      openModal({
        type: 'info',
        title: t('success'),
        text: 'Канал создан',
      });
    } else if (res.status === 'error') {
      openModal({
        type: 'info',
        title: t('error'),
        text: res.message,
      });
    }
  });
};`;

const ChangeName = `const changeName = () => {
  wsClient.send({
    type: 'social',
    action: 'channels/change/name',
    channel_id: 123, // Идентификатор канала
    name: 'Хароми' // Новое имя
  }).then((res) => {
    if (res.status === 'success') {
      updateData();
    } else {
      showError(res);
    }
  })
};`;

const ChangeUsername = `const changeUsername = () => {
  wsClient
    .send({
      type: 'social',
      action: 'channels/change/username',
      channel_id: 123, // Идентификатор канала
      username: 'qwerty1', // Новое уникальное имя
    })
    .then((res) => {
      if (res.status === 'success') {
        updateData();
      } else {
        showError(res);
      }
    });
};
`;

const ChangeDescription = `const changeDescription = () => {
  wsClient
    .send({
      type: 'social',
      action: 'channels/change/description',
      channel_id: 123, // Идентификатор канала
      description: 'Всем привет! это канал...', // Новое описание
    })
    .then((res) => {
      if (res.status === 'success') {
        updateData();
      } else {
        showError(res);
      }
    });
};
`;

const ChangeCover = `wsClient.send({
  type: 'social',
  action: 'channels/change/cover/upload',
  channel_id: 123, // Идентификатор канала
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
  action: 'channels/change/avatar/upload',
  channel_id: 123, // Идентификатор канала
  file: new Uint8Array([]), // Файл в формате Unit8Array
}).then((res) => {
  if (res.status === 'success') {
      updateData();
  } else {
      showError(res);
  }
})`;

export default {
    Create,
    ChangeName,
    ChangeUsername,
    ChangeDescription,
    ChangeCover,
    ChangeAvatar
}