const BoxButton = ({ title, icon, onClick }) => {
    return (
        <button
            className="UI-BoxButton"
            onClick={onClick}
        >
            <div className="Icon">
                {icon}
            </div>
            <div className="Title">{title}</div>
        </button>
    )
}

export default BoxButton;