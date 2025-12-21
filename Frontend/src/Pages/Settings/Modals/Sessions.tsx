import { useEffect, useState } from 'react';
import { I_ANDROID, I_ANONYMOUS, I_APPLE, I_CLOSE, I_SAFARI, I_WINDOWS } from '../../../System/UI/IconPack';
import { useTranslation } from 'react-i18next';
import { useModalsStore } from '../../../Store/modalsStore';
import { useWebSocket } from '../../../System/Context/WebSocket';

interface Session {
  id: string;
  device_type: number;
  device: string;
}

const Sessions = () => {
  const { openModal } = useModalsStore() as any;
  const { t } = useTranslation();
  const { wsClient } = useWebSocket();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    wsClient.send({
      type: 'social',
      action: 'auth/sessions/load'
    }).then((res) => {
      if (res.status === 'success') {
        if (res.sessions && res.sessions.length > 0) {
          setCurrentSession(res.current_session);
          setSessions(res.sessions.filter((session) => {
            return session && res.current_session && session.id !== res.current_session.id;
          }));
        }
      } else if (res.status === 'error') {
        openModal({
          type: 'alert',
          props: {
            title: t('error'),
            message: res.message
          }
        });
      }
    });
  }, []);

  const deleteSession = (id) => {
    const deleteRequest = () => {
      wsClient.send({
        type: 'social',
        action: 'auth/sessions/delete',
        session_id: id
      }).then((res) => {
        if (res.status === 'success') {
          setSessions(sessions.filter((session) => session && session.id !== id));
        } else if (res.status === 'error') {
          openModal({
            type: 'alert',
            props: {
              title: t('error'),
              message: res.message
            }
          });
        }
      });
    };

    openModal({
      type: 'query',
      props: {
        title: t('sessions_delete_title'),
        message: t('sessions_delete_text'),
        onConfirm: () => {
          deleteRequest();
        }
      }
    });
  };

  const terminateAllSessions = () => {
    openModal({
      type: 'query',
      props: {
        title: t('sessions_delete_title'),
        message: t('clear_all_data_confirmation'),
        onConfirm: async () => {
          try {
            const sessionsToDelete = [...sessions];
            let deletedCount = 0;

            for (const session of sessionsToDelete) {
              if (session && session.id) {
                try {
                  const res = await wsClient.send({
                    type: 'social',
                    action: 'auth/sessions/delete',
                    session_id: session.id
                  });

                  if (res.status === 'success') {
                    deletedCount++;
                  }
                } catch (err) {
                  console.error('Ошибка при удалении сессии:', err);
                }
              }
            }

            setSessions([]);

            if (deletedCount > 0) {
              const getSessionsText = (count) => {
                const pluralRules = new Intl.PluralRules('ru-RU');
                const forms = {
                  'one': 'сессия завершена',
                  'few': 'сессии завершено',
                  'many': 'сессий завершено'
                };
                return `${count} ${forms[pluralRules.select(count)]}`;
              };

              openModal({
                type: 'alert',
                props: {
                  title: t('success'),
                  message: getSessionsText(deletedCount)
                }
              });
            } else {
              openModal({
                type: 'alert',
                props: {
                  title: t('error'),
                  message: t('error_occurred')
                }
              });
            }
          } catch (error) {
            openModal({
              type: 'alert',
              props: {
                title: t('error'),
                message: t('error_occurred')
              }
            });
          }
        }
      }
    });
  };

  const HandleSession = ({ session, current }) => {
    if (!session) return null;

    let icon;
    let name;
    switch (session.device_type) {
      case 0:
        icon = <I_ANONYMOUS />;
        name = t('sessions_anon');
        break;
      case 1:
        icon = <I_SAFARI />;
        name = t('sessions_browser');
        break;
      case 2:
        icon = <I_ANDROID />;
        name = 'Android';
        break;
      case 3:
        icon = <I_APPLE />;
        name = 'iOS';
        break;
      case 4:
        icon = <I_WINDOWS />;
        name = 'Windows';
        break;
      default:
        icon = <I_ANONYMOUS />;
        name = t('sessions_anon');
    }

    return (
      <div className="UI-PB_C_Element Settings-Session">
        <div className="Icon">
          {icon}
        </div>
        <div className="Info">
          <div className="DeviceType">
            {name}
          </div>
          <div className="Device">
            {session.device}
          </div>
        </div>
        {
          !current && (
            <button onClick={() => { deleteSession(session.id) }}>
              <I_CLOSE />
            </button>
          )
        }
      </div>
    );
  };

  return (
    <>
      <img
        src="/static_sys/Images/All/Sessions.svg"
        className="UI-PB_Image"
        alt="фыр"
        draggable={false}
      />
      {
        currentSession && (
          <>
            <div className="UI-PartitionName">{t('sessions_current')}</div>
            <div className="UI-PB_Column">
              <HandleSession session={currentSession} current={true} />
            </div>
          </>
        )
      }
      {
        sessions && sessions.length > 0 && (
          <>
            <div className="UI-PartitionName">{t('sessions_all')}</div>
            <div className="UI-PB_Column">
              {
                sessions
                  .filter(session => session && session.id)
                  .sort((a, b) => String(a.id).localeCompare(String(b.id)))
                  .map((session) => (
                    <HandleSession key={session.id} session={session} current={false} />
                  ))
              }
            </div>
          </>
        )
      }

      {sessions && sessions.length > 0 && (
        <button
          className="Sessions-TerminateAll"
          onClick={terminateAllSessions}
        >
          {t('sessions_terminate_all')}
        </button>
      )}
    </>
  );
};

export default Sessions;
