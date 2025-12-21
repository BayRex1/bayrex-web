import BoxButton from '../Buttons/BoxButton';

const BoxButtons = ({ buttons }) => {
    return (
        buttons.length > 0 && (
            <div className="UI-BoxButtons">
                {
                    buttons.map((button, i) => (
                        <BoxButton
                            key={i}
                            icon={button.icon}
                            title={button.title}
                            onClick={button.onClick}
                        />
                    ))
                }
            </div>
        )
    )
}

export default BoxButtons;