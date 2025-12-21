import Avatar from '../Base/Avatar';

const AvatarInput = ({ avatar, name, onChange, isUploading }) => {
    return (
        <div
            className="UI-AvatarInput"
        >
            <Avatar
                avatar={avatar}
                name={name}
                isUploading={isUploading}
                size={70}
            />
            <input
                type="file"
                accept="image/*"
                onChange={onChange}
            />
        </div>
    );
}

export default AvatarInput;
