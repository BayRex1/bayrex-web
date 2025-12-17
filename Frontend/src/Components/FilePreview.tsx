import { useRef, useEffect, useState } from 'react';
import { I_CLOSE, I_PLAY } from '../System/UI/IconPack';
import { HandleFileIcon, HandleFileSize } from '../System/Elements/Handlers';
import { createExplosionEffect } from '../System/Elements/ExplosionEffect';
import classNames from 'classnames';

interface FilePreviewProps {
    file: File;
    index: number;
    onRemove: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, index, onRemove }) => {
    const fileRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    useEffect(() => {
        if (isImage || isVideo) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            if (isVideo && videoRef.current) {
                videoRef.current.addEventListener('loadeddata', () => {
                    if (videoRef.current) {
                        videoRef.current.currentTime = 1;
                    }
                });
            }

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [file, isImage, isVideo]);

    const handleRemove = () => {
        if (fileRef.current) {
            createExplosionEffect(fileRef.current);

            setTimeout(() => {
                onRemove(index);
            }, 100);
        } else {
            onRemove(index);
        }
    };

    return (
        <div
            className={classNames('Post-FilePreview', {
                ImageFile: isImage,
                VideoFile: isVideo,
            })}
            ref={fileRef}
        >
            {isImage && previewUrl ? (
                <img src={previewUrl} alt={file.name} className="ImagePreview" />
            ) : isVideo && previewUrl ? (
                <div className="VideoPreview">
                    <video
                        ref={videoRef}
                        src={previewUrl}
                        className="VideoThumbnail"
                        preload="metadata"
                    />
                    <div className="PlayButton" style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2
                    }}>
                        <I_PLAY className="VideoPlayIcon" />
                    </div>
                </div>
            ) : (
                <div className="Icon">
                    <HandleFileIcon fileName={file.name} />
                </div>
            )}
            <div className="Metadata">
                <div className="Name">{file.name}</div>
                <div className="Size">
                    <HandleFileSize bytes={file.size} />
                </div>
            </div>
            <button
                className="RemoveFile"
                onClick={handleRemove}
                aria-label="Удалить файл"
            >
                <I_CLOSE />
            </button>
        </div>
    );
};

export default FilePreview; 