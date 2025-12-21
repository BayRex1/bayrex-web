const ListButtons = ({ buttons }) => {
    return (
        <div className="UI-Buttons">
            {buttons.map((button, i) => (
                <button
                    key={i}
                    onClick={button.onClick}
                >
                    {button.icon && (
                        <div className="Icon">
                            {button.icon}
                        </div>
                    )}
                    <div className="ButtonContent">
                        <div className="ButtonTitle">{button.title}</div>
                        {button.subtitle && (
                            <div className="ButtonSubtitle">{button.subtitle}</div>
                        )}
                    </div>
                </button>
            ))}
        </div>
    )
}

export default ListButtons;