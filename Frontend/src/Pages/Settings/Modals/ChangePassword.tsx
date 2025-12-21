import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalsStore } from '../../../Store/modalsStore';
import { Button, TextInput } from '../../../UIKit';
import { useWebSocket } from '../../../System/Context/WebSocket';

const ChangePassword = () => {
  const { t } = useTranslation();
  const { wsClient } = useWebSocket();
  const { openModal } = useModalsStore() as any;
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const changePassword = () => {
    const data = {
      type: 'social',
      action: 'change_profile/password',
      old_password: oldPassword,
      new_password: newPassword,
    };

    wsClient.send(data).then((res) => {
      if (res.status === 'success') {
        openModal({
          type: 'alert',
          props: {
            title: t('success'),
            message: 'Пароль изменён'
          }
        })
      } else if (res.status === 'error') {
        openModal({
          type: 'alert',
          props: {
            title: t('error'),
            message: res.message
          }
        })
      }
    })
  };

  return (
    <>
      <img
        src="/static_sys/Images/All/ChangePassword.svg"
        className="UI-PB_Image"
        alt="фыр"
        draggable={false}
      />
      <div className="UI-PB_InputText">
        Запомните или запишите пароль, если вы его забудете, вы не сможете войти
        в аккаунт.
      </div>
      <div
        className="UI-Block"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <TextInput
          placeholder="Старый пароль"
          type="text"
          value={oldPassword}
          onChange={(e) => { setOldPassword(e.target.value) }}
          transparent={true}
        />
        <TextInput
          placeholder="Новый пароль"
          type="text"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value) }}
          transparent={true}
        />
        <div style={{ marginTop: 5, display: 'flex' }}>
          <Button
            title={t('change')}
            onClick={changePassword}
            buttonStyle="action"
            isActive={(oldPassword !== '' && newPassword !== '')}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </>
  );
};

export default ChangePassword;