import { useTranslation } from 'react-i18next';
import { Avatar } from '../../../UIKit';
import { useNavigate } from 'react-router-dom';
import handleNotificationContent from '../../../UIKit/Utils/handleNotificationContent';
import classNames from 'classnames';
import { HandleTimeAge } from '../../../System/Elements/Handlers';

const Notification = ({ notification }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleClick = ({ action, content }) => {
        switch (action) {
            case 'PostLike':
                navigate(`/post/${content?.post?.id}`)
                break;
            case 'PostDislike':
                navigate(`/post/${content?.post?.id}`)
                break;
            case 'PostComment':
            case 'ReplyComment':
                navigate(`/post/${content?.post?.id}`)
                break;
            case 'ProfileSubscribe':
                navigate(`/e/${content?.profile?.username}`)
                break;
            case 'ProfileUnsubscribe':
                navigate(`/e/${content?.profile?.username}`)
                break;
            case 'Message':
                navigate(`/chat`)
                break;
        }
    }

    const notificationContent = handleNotificationContent(notification, t);

    return (
        <button
            onClick={() => handleClick({ action: notification.action, content: notification.content })}
            className={classNames('Notifications-Notification', 'UI-Block')}
        >
            <div className="AvatarContainer">
                <Avatar
                    avatar={notification.author.avatar}
                    name={notification.author.name}
                    size={40}
                />
                {notificationContent.icon}
            </div>
            <div className="NotificationContent">
                <div className="Title">{notification.author.name}</div>
                <div className="Text">
                    {notificationContent.text}
                </div>
            </div>
            <div className="Date"><HandleTimeAge inputDate={notification.date} /></div>
        </button>
    )
}

export default Notification;
