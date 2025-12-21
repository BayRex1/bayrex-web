import { HandleSubscribers } from '../../../System/Elements/Handlers';
import Avatar from '../Base/Avatar';

interface UserProps {
    user: any;
    onClick?: any;
}

const User = ({ user, onClick }: UserProps) => {
    return (
        <button
            className="UI-ListElement"
            onClick={onClick}
        >
            <Avatar
                avatar={user.avatar}
                name={user.name}
                size={40}
            />
            <div className="Body">
                <div className="Title">{user.name}</div>
                <div className="Desc">
                    <HandleSubscribers count={user.subscribers} />
                    {' • '}
                    {user.posts} постов
                </div>
            </div>
        </button>
    )
}

export default User;
