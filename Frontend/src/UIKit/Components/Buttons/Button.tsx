import classNames from 'classnames';

interface ButtonProps {
    title: string;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    buttonStyle?: any;
    isLoading?: boolean;
    isActive?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onClick,
    className,
    style,
    buttonStyle,
    isLoading = false,
    isActive = true
}) => {
    const handleClick = () => {
        if (!isLoading && isActive && onClick) {
            onClick();
        }
    };

    const getStyleClass = () => {
        switch (buttonStyle) {
            case 'action':
                return 'UI-Button--action';
            default:
                return '';
        }
    };

    return (
        <button
            className={classNames(
                'UI-Button',
                className,
                getStyleClass(),
                { 'UI-Button--noActive': !isActive }
            )}
            onClick={handleClick}
            style={style}
        >
            {isLoading && (
                <div className="UI-PRELOAD"></div>
            )}
            {title}
        </button>
    );
};

export default Button;
