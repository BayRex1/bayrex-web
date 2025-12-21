import classNames from 'classnames';
import { ring } from 'ldrs';
import { I_SEND } from '../../../System/UI/IconPack';

const SendButton = ({ className, onClick, isLoading }) => {

    ring.register();

    const handleClick = () => {
        if (!isLoading && onClick) {
            onClick();
        }
    }

    return (
        <button className={classNames('UI-Send', className)} onClick={handleClick}>
            {
                isLoading ? <l-ring
                    size="20"
                    stroke="2"
                    bg-opacity="0"
                    speed="2"
                    color="rgb(255, 255, 255)"
                ></l-ring> : <I_SEND />
            }
        </button>
    )
}

export default SendButton;