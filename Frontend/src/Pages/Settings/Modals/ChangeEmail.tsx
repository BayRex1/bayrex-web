import { useState } from 'react';
import { useModalsStore } from '../../../Store/modalsStore';
import { useTranslation } from 'react-i18next';
import { Button, TextInput } from '../../../UIKit';
import { useAuth } from '../../../System/Hooks/useAuth';
import { useWebSocket } from '../../../System/Context/WebSocket';

const ChangeEmail = () => {
  const { accountData, updateAccount } = useAuth();
  const { wsClient } = useWebSocket();
  const { t } = useTranslation();
  const { openModal } = useModalsStore() as any;
  const [email, setEmail] = useState(accountData.email);

  const changeEmail = () => {
    if (email !== accountData.email) {

      wsClient.send({
        type: 'social',
        action: 'change_profile/email',
        email: email
      }).then((res) => {
        if (res.status === 'success') {
          updateAccount({ email: email });
          openModal({
            type: 'alert',
            props: {
              title: t('success'),
              message: 'Ваша почта была успешно изменена'
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
    }
  }

  return (
    <>
      <img
        src="/static_sys/Images/All/ChangeEmail.svg"
        className="UI-PB_Image"
        alt="фыр"
        draggable={false}
      />
      <div id="S-CP_EmailTitle" className="UI-PB_InputText">
        Текущая: {accountData.email}
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
          placeholder="Введите почту"
          type="text"
          value={email}
          onChange={(e) => { setEmail(e.target.value) }}
          transparent={true}
        />
        <div style={{ marginTop: 5, display: 'flex' }}>
          <Button
            title={t('change')}
            onClick={changeEmail}
            buttonStyle="action"
            isActive={(email !== accountData.email)}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </>
  );
};

export default ChangeEmail;
