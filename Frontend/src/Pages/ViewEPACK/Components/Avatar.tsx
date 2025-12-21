const Avatar = ({ avatar, name }) => {
    return (
        <div className="Avatar" style={{ width: 40, height: 40 }}>
            {
                avatar
                    ? <img src={`data:image/jpeg;base64,${avatar}`} alt="фыр" />
                    : <div className="NonAvatar">{name[0] || '?'}</div>
            }
        </div>
    )
};

export default Avatar;
