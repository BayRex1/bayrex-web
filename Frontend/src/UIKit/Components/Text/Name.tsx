import classNames from 'classnames';
import { HandleUserIcons } from '../../../System/Elements/Handlers';

const Name = ({ name, icons, className, styles }: any) => {
    return (
        <div className={classNames('UI-NameBody', className)} style={styles}>
            <div className="Name">
                {name}
            </div>
            {icons && (
                <HandleUserIcons icons={icons} />
            )}
        </div>
    )
}

export default Name;
