const Notifications = ({ count }) => {
    return (
        count > 0 && (
            <div className="UI-NCounter">{count}</div>
        )
    )
}

export default Notifications;
