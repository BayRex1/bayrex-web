import classNames from 'classnames';
import NeoImage from './NeoImage';
import { useNavigate } from 'react-router-dom';
import UploadLoader from '../Loaders/UploadLoader';
import { memo, useCallback, useMemo } from 'react';

interface AvatarProps {
    avatar?: string | null;
    name: string;
    className?: string;
    onClick?: () => void;
    to?: string;
    loading?: boolean;
    isLoaded?: boolean;
    isUploading?: boolean;
    size?: any;
}

const Avatar: React.FC<AvatarProps> = memo(({
    avatar,
    name,
    className,
    onClick,
    to,
    loading = false,
    isLoaded = false,
    isUploading = false,
    size = 0
}) => {
    const navigate = useNavigate();
    const sizeStyle = size !== 0 ? { width: size, height: size, fontSize: size * 0.5 } : undefined;

    const handleClick = useCallback(() => {
        if (to) {
            navigate(to);
        }
        if (onClick) {
            onClick();
        }
    }, [to, onClick, navigate]);

    const parsedAvatar = useMemo(() => {
        if (!avatar) return null;
        if (typeof avatar === 'string') {
            try {
                return JSON.parse(avatar);
            } catch {
                return null;
            }
        }
        return avatar;
    }, [avatar]);

    return (
        <div
            onClick={handleClick}
            className={classNames('Avatar', className)}
            {...(size !== undefined ? { style: sizeStyle } : {})}
        >
            {
                !avatar ? (
                    <div className="NonAvatar">{name?.length > 0 ? name.charAt(0) : '?'}</div>
                ) : (
                    <NeoImage
                        image={parsedAvatar}
                        style={{}}
                    />
                )
            }
            {
                (loading && !isLoaded) && (
                    <div className="UI-PRELOAD"></div>
                )
            }
            {
                isUploading && (
                    <UploadLoader />
                )
            }
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.avatar === nextProps.avatar &&
        prevProps.name === nextProps.name &&
        prevProps.isUploading === nextProps.isUploading &&
        prevProps.loading === nextProps.loading &&
        prevProps.isLoaded === nextProps.isLoaded &&
        prevProps.size === nextProps.size &&
        prevProps.className === nextProps.className &&
        prevProps.onClick === nextProps.onClick &&
        prevProps.to === nextProps.to;
});

export default Avatar;
export type { AvatarProps };
