import classNames from 'classnames';
import NeoImage from './NeoImage';
import UploadLoader from '../Loaders/UploadLoader';
import { memo, useCallback, useMemo } from 'react';
import { isEqual } from 'lodash';

interface CoverProps {
    cover?: string | null;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    loading?: boolean;
    isLoaded?: boolean;
    isUploading?: boolean;
}

const Cover: React.FC<CoverProps> = memo(({
    cover,
    className,
    style,
    onClick,
    loading = false,
    isLoaded = false,
    isUploading = false
}) => {
    const handleClick = useCallback(() => {
        if (onClick) {
            onClick();
        }
    }, [onClick]);

    const parsedCover = useMemo(() => {
        if (!cover) return null;
        if (typeof cover === 'string') {
            try {
                return JSON.parse(cover);
            } catch {
                return null;
            }
        }
        return cover;
    }, [cover]);

    return (
        <div
            className={classNames('UI-Cover', className)}
            style={style}
            onClick={handleClick}
        >
            {
                cover && (
                    <NeoImage
                        image={parsedCover}
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
    return prevProps.cover === nextProps.cover &&
           prevProps.isUploading === nextProps.isUploading &&
           prevProps.loading === nextProps.loading &&
           prevProps.isLoaded === nextProps.isLoaded &&
           prevProps.className === nextProps.className &&
           isEqual(prevProps.style, nextProps.style);
});

export default Cover;
export type { CoverProps };
