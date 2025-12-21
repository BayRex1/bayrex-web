import { memo, useMemo } from 'react';
import { I_MUSIC } from '../../../System/UI/IconPack';
import NeoImage from './NeoImage';

interface MusicCoverProps {
    cover?: {
        simple_image?: string;
        image?: string;
    } | null;
    lossless?: boolean;
    icon?: React.ReactNode;
    width?: number;
    borderRadius?: number;
    shadows?: boolean;
    onClick?: () => void;
}

const MusicCover: React.FC<MusicCoverProps> = memo(({
    cover,
    lossless = false,
    icon,
    width,
    borderRadius = 8,
    shadows = false,
    onClick
}) => {
    const musicIcon = useMemo(() => <I_MUSIC />, []);

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <div
            onClick={handleClick}
            className="UI-MusicCover"
            style={{
                width: width ? `${width}px` : '',
                height: width ? `${width}px` : ''
            }}
        >
            {cover ? (
                <>
                    <NeoImage
                        className="Cover"
                        style={{
                            borderRadius: `${borderRadius}px`
                        }}
                        image={cover}
                        lossless={lossless}
                        draggable={false}
                    />
                    {shadows && (
                        <NeoImage
                            className="CoverShadow"
                            image={cover}
                            lossless={false}
                            draggable={false}
                        />
                    )}
                </>
            ) : (
                <div
                    className="NoneCover"
                    style={{
                        borderRadius: `${borderRadius}px`
                    }}
                >
                    {icon || musicIcon}
                </div>
            )}
        </div>
    );
});

export default MusicCover;
