import { useEffect, useRef, useState } from 'react';
import { HandleText } from '../../System/Elements/Handlers';
import { I_ADVANCED, I_EMAIL, I_INFO, I_LANG, I_LOCK, I_PHONE, I_STORAGE, I_USERNAME, I_USERS, I_WARNING, I_REPORT } from '../../System/UI/IconPack';
import { useTranslation } from 'react-i18next';
import Themes from './Components/Themes';
import { useModalsStore } from '../../Store/modalsStore';
import Links from './Components/Links';
import { NavButton } from '../../Components/Navigate';
import { Avatar, Cover, QuestionModal, Textarea, TextInput } from '../../UIKit';
import { useAuth } from '../../System/Hooks/useAuth';
import { useWebSocket } from '../../System/Context/WebSocket';
import '../../System/UI/ThemePrev.scss';
import './Settings.scss';
import getModal from './Utils/gitModal';

const SettingsIcon = ({ iconBackground, children }) => {
  return (
    <div style={{ background: iconBackground }} className="Icon">
      {children}
    </div>
  );
}

const Settings = () => {
  const { t } = useTranslation();
  const { wsClient } = useWebSocket();
  const { openModal } = useModalsStore();
  const { accountData, updateAccount } = useAuth();
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [name, setName] = useState(accountData.name);
  const [description, setDescription] = useState(accountData.description);
  const emailRef = useRef(null);
  const [emailHovered, setEmailHovered] = useState(false);

  const [typeViewPosts, setTypeViewPosts] = useState(() => {
    const saved = localStorage.getItem('S-PostsType');
    return saved || 'last';
  });

  useEffect(() => {
    localStorage.setItem('S-PostsType', typeViewPosts);
  }, [typeViewPosts]);

  const handlePartitionClick = ({ type, params }: any) => {
    const { title, Element } = getModal(type, t);

    openModal({
      type: 'routed',
      props: {
        title: title,
        children: (
          <Element
            params={params}
            handlePartitionClick={handlePartitionClick}
            accountData={accountData}
          />
        )
      }
    })
  };

  const deleteAvatar = () => {
    const getDelete = () => {
      wsClient.send({
        type: 'social',
        action: 'change_profile/avatar/delete'
      })
      updateAccount({ avatar: null });
    }

    openModal({
      type: 'query',
      props: {
        title: t('are_you_sure'),
        message: 'Вы уверены что хотите удалить аватар?',
        onConfirm: getDelete
      }
    })
  }

  const deleteCover = () => {
    const getDelete = () => {
      wsClient.send({
        type: 'social',
        action: 'change_profile/cover/delete'
      })
      updateAccount({ cover: null });
    }

    openModal({
      type: 'query',
      props: {
        title: t('are_you_sure'),
        text: 'Вы уверены что хотите удалить обложку?',
        onConfirm: getDelete
      }
    })
  }

  const handleChangeFile = async (type, fileInputRef, setUploading) => {
    setUploading(true);
    const file = fileInputRef.current.files[0];

    if (file) {
      const arrayBuffer = await file.arrayBuffer();

      wsClient.send({
        type: 'social',
        action: `change_profile/${type}/upload`,
        file: new Uint8Array(arrayBuffer)
      }).then((res: any) => {
        console.log(res);
        if (res.status === 'success') {
          setUploading(false);
          updateAccount({ [type === 'avatar' ? 'avatar' : 'cover']: res[type === 'avatar' ? 'avatar' : 'cover'] });
        } else if (res.status === 'error') {
          setUploading(false);
          openModal({
            type: 'alert',
            props: {
              title: t('error'),
              message: res.message,
            }
          });
        }
      })
    } else {
      setUploading(false);
      openModal({
        type: 'alert',
        props: {
          title: t('error'),
          message: t('file_not_selected'),
        }
      });
    }
  };

  const changeAvatar = () => handleChangeFile('avatar', avatarInputRef, setAvatarUploading);
  const changeCover = () => handleChangeFile('cover', coverInputRef, setCoverUploading);

  const changeProfile = () => {
    const showError = (res) => {
      openModal({
        type: 'info',
        props: {
          title: t('error'),
          message: res.message,
        }
      });
    }

    if (name !== accountData.name) {
      const data = {
        type: 'social',
        action: 'change_profile/name',
        name: name
      }

      wsClient.send(data).then((res) => {
        if (res.status === 'success') {
          updateAccount({ name: name });
        } else if (res.status === 'error') {
          showError(res);
        }
      })
    }
    if (description !== accountData.description) {
      const data = {
        type: 'social',
        action: 'change_profile/description',
        description: description
      }

      wsClient.send(data).then((res) => {
        if (res.status === 'success') {
          updateAccount({ description: description });
        } else if (res.status === 'error') {
          showError(res);
        }
      })
    }
  }

  const showEmail = () => {
    setEmailHovered(true);
  }
  const hideEmail = () => {
    setEmailHovered(false);
  }

  return (
    <>
      <div className="UI-C_R">
        <div className="UI-ScrollView">
          <div className="UI-Block Profile-InfoBlock UI-B_FIRST">
            <div className="UI-Title" style={{ width: '100%' }}>
              {t('my_profile')}
            </div>

            <Cover
              cover={accountData.cover}
              isUploading={coverUploading}
            />
            <div className="AvatarContainer">
              <Avatar
                avatar={accountData.avatar}
                name={accountData.username}
                size={88}
                isUploading={avatarUploading}
              />
            </div>

            <div className="UI-NameBody">
              <div className="Name">
                {accountData.name}
              </div>
            </div>

            <div className="Username">@{accountData.username}</div>
            <div
              onMouseEnter={showEmail}
              onMouseLeave={hideEmail}
              className={`Settings-PRFL_Email${emailHovered ? ' hover' : ''}`}
              ref={emailRef}
            >
              {accountData.email}
            </div>
            {accountData.description && (
              <div className="UI-Description">
                <div className="Title">{t('description')}</div>
                <div className="Text">
                  <HandleText text={accountData.description} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="UI-C_L">
        <div id="SETTINGS-BODY" className="UI-ScrollView">
          <div className="UI-Block UI-B_FIRST">
            <div className="UI-Title">{t('edit_profile_title')}</div>
            <div className="Settings-CP_Cover">
              <Cover
                cover={accountData.cover}
                isUploading={coverUploading}
              />
              <div className="Settings-ChangeButtons">
                <input
                  id="S-CP_UPLOAD_COVER"
                  type="file"
                  accept="image/*"
                  autoComplete="off"
                  ref={coverInputRef}
                  onChange={changeCover}
                />
                <label htmlFor="S-CP_UPLOAD_COVER" className="Button">
                  {t('upload_button')}
                </label>
                <button onClick={deleteCover} className="ButtonDL">
                  {t('delete_button')}
                </button>
              </div>
            </div>
            <div className="Settings-CP_Avatar">
              <Avatar
                avatar={accountData.avatar}
                name={accountData.username}
                size={70}
                isUploading={avatarUploading}
              />
              <div className="Settings-ChangeButtons">
                <form id="S-CP_UPLOAD_AVATAR_FORM" encType="multipart/form-data">
                  <input
                    id="S-CP_UPLOAD_AVATAR"
                    type="file"
                    accept="image/*"
                    ref={avatarInputRef}
                    onChange={changeAvatar}
                  />
                </form>
                <label htmlFor="S-CP_UPLOAD_AVATAR" className="Button">
                  {t('upload_button')}
                </label>
                <button onClick={deleteAvatar} className="ButtonDL">
                  {t('delete_button')}
                </button>
              </div>
            </div>
            <div className="Settings-CP_Input_container">
              <div className="Title">{t('settings_name')}</div>
              <TextInput
                className="UI-Input"
                placeholder={t('input_text')}
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
              />
              <QuestionModal input={name} target={accountData.name} set={setName} onApply={changeProfile} />
            </div>
            <div className="Settings-CP_Input_container">
              <div className="Title">{t('description')}</div>
              <Textarea
                className="UI-Input"
                placeholder={t('input_text')}
                value={description}
                maxLength={1000}
                onChange={(e) => setDescription(e.target.value)}
              />
              <QuestionModal input={description} target={accountData.description} set={setDescription} onApply={changeProfile} />
            </div>
            <Links
              handlePartitionClick={handlePartitionClick}
              accountData={accountData}
            />
          </div>
          <div className="UI-PartitionName">{t('partition_account')}</div>
          <div className="UI-Buttons">
            <button onClick={() => handlePartitionClick({ type: 'change_username' })}>
              <SettingsIcon iconBackground="rgb(71 42 221)">
                <I_USERNAME />
              </SettingsIcon>
              {t('change_username')}
            </button>
          </div>
          <div className="UI-PartitionName">{t('partition_confidentiality')}</div>
          <div className="UI-Buttons">
            <button onClick={() => handlePartitionClick({ type: 'sessions' })}>
              <SettingsIcon iconBackground="rgb(12 227 0)">
                <I_PHONE />
              </SettingsIcon>
              {t('sessions')}
            </button>
            <button onClick={() => handlePartitionClick({ type: 'change_email' })}>
              <SettingsIcon iconBackground="rgb(255 82 82)">
                <I_EMAIL />
              </SettingsIcon>
              {t('change_email')}
            </button>
            <button onClick={() => handlePartitionClick({ type: 'change_password' })}>
              <SettingsIcon iconBackground="rgb(71 42 221)">
                <I_LOCK />
              </SettingsIcon>
              {t('change_password')}
            </button>
          </div>
          <div className="UI-PartitionName">{t('partition_other')}</div>
          <div className="UI-Buttons">
            <button onClick={() => handlePartitionClick({ type: 'profile_status' })}>
              <SettingsIcon iconBackground="var(--ACCENT_COLOR)">
                <I_WARNING />
              </SettingsIcon>
              {t('my_status')}
            </button>
            <button onClick={() => handlePartitionClick({ type: 'change_language' })}>
              <SettingsIcon iconBackground="rgb(76 107 204)">
                <I_LANG />
              </SettingsIcon>
              {t('language')}
            </button>
            <button onClick={() => handlePartitionClick({ type: 'authors' })}>
              <SettingsIcon iconBackground="rgb(76 107 204)">
                <I_USERS />
              </SettingsIcon>
              {t('authors')}
            </button>
            <button onClick={() => handlePartitionClick({ type: 'advanced' })}>
              <SettingsIcon iconBackground="rgb(89 175 255)">
                <I_ADVANCED />
              </SettingsIcon>
              {t('settings.advanced.title')}
            </button>
            <button onClick={() => handlePartitionClick({ type: 'storage' })}>
              <SettingsIcon iconBackground="rgb(89 175 255)">
                <I_STORAGE />
              </SettingsIcon>
              {t('storage')}
            </button>
            <button onClick={() => handlePartitionClick({ type: 'my_reports' })}>
              <SettingsIcon iconBackground="rgb(255 82 82)">
                <I_REPORT />
              </SettingsIcon>
              {t('my_reports')}
            </button>
            <button onClick={() => handlePartitionClick({ type: 'my_appeals' })}>
              <SettingsIcon iconBackground="rgb(255 165 0)">
                <I_WARNING />
              </SettingsIcon>
              Мои апелляции
            </button>
            <NavButton to="/info/advantages">
              <SettingsIcon iconBackground="rgb(101 85 180)">
                <I_INFO />
              </SettingsIcon>
              {t('info')}
            </NavButton>
          </div>
          <div className="UI-PartitionName">{t('partition_posts_type')}</div>
          <div className="UI-Block">
            <div className="Settings-PType">
              {['last', 'rec', 'subscribe'].map((type) => (
                <button
                  key={type}
                  className={typeViewPosts === type ? 'Active' : ''}
                  onClick={() => setTypeViewPosts(type)}
                >
                  {type === 'last' ? t('category_last') : type === 'rec' ? t('category_recommended') : t('category_subscriptions')}
                </button>
              ))}
            </div>
          </div>
          <div className="UI-PartitionName">{t('partition_change_theme')}</div>
          <div className="UI-Block Settings-Themes">
            <Themes />
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
