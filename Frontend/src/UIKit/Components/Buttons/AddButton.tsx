import classNames from 'classnames';
import { memo } from 'react';

interface AddButtonProps {
    title?: string;
    onClick?: () => void;
    className?: string;
}

const AddButton: React.FC<AddButtonProps> = ({ title, onClick, className }) => {
    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    }

    return (
        <button
            className={classNames('UI-AddButton', className)}
            onClick={handleClick}
        >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m0 0h24v24h-24z" opacity="0" transform="matrix(-1 0 0 -1 24 24)" /><path d="m19 11h-6v-6a1 1 0 0 0 -2 0v6h-6a1 1 0 0 0 0 2h6v6a1 1 0 0 0 2 0v-6h6a1 1 0 0 0 0-2z" /></svg>
            {title}
        </button>
    )
}

export default memo(AddButton);
