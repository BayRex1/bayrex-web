import classNames from 'classnames';
import { memo } from 'react';

interface FormButtonProps {
    title?: string;
    onClick?: () => void;
    className?: string;
    type?: 'submit' | 'reset' | 'button';
    id?: string;
    isLoading?: boolean;
}

const FormButton: React.FC<FormButtonProps> = ({ title, onClick, className, type, id, isLoading }) => {

    const handleClick = () => {
        if (!isLoading && onClick) {
            onClick();
        }
    }

    return (
        <button
            onClick={handleClick}
            className={classNames('UI-FormButton', className)}
            type={type}
            id={id}
        >
            {isLoading && (
                <div className="UI-PRELOAD"></div>
            )}
            {title}
        </button>
    )
}

export default memo(FormButton);