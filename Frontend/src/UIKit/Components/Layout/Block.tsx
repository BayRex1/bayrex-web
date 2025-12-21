import classNames from 'classnames';

interface BlockProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const Block = ({ children, className, style }: BlockProps) => {
    return (
        <div
            className={classNames('UI-Block', className)}
            style={style}
        >
            {children}
        </div>
    );
}

export default Block;