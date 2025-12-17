import { useTranslation } from 'react-i18next';
import { HandleFileIcon, HandleFileSize } from '../../../System/Elements/Handlers';
import { useRef, useState } from 'react';
import { useDatabase } from '../../../System/Context/Database';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { downloadBlob } from '../../../System/Elements/Function';
import classNames from 'classnames';

const UserContentFile = ({ className, file, path, downloadButton = false, filesCount = 0 }) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const db = useDatabase();
    const [progress, setProgress] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const isCancelled = useRef(false);

    const download = async () => {
        if (isLoading) return;

        const cachedFile = await db.files_cache.get([path, file.file]);

        if (cachedFile && cachedFile.file_blob && cachedFile.file_blob.size > 0) {
            downloadBlob(cachedFile.file_blob, file.name);
            return;
        }

        setIsLoading(true);
        let offset = 0;
        let isLastChunk = false;

        try {
            while (!isLastChunk && !isCancelled.current) {
                const res = await wsClient.send({
                    type: 'download',
                    action: 'file',
                    payload: {
                        path: path,
                        file: file.file,
                        offset
                    },
                });

                if (isCancelled.current) return;

                if (res.status !== 200) {
                    throw new Error(`Ошибка при скачивании чанка: ${res.status}`);
                }

                const chunkData: Uint8Array = res.buffer;

                await db.files_chunks.put({
                    id: `${file.file}-${offset}`,
                    path: 'posts/files',
                    file: file.file,
                    offset,
                    binary: chunkData
                });

                offset += chunkData.byteLength;
                isLastChunk = res.is_last_chunk;
                setProgress(offset);
            }

            const chunks = await db.files_chunks
                .where('file')
                .equals(file.file)
                .sortBy('offset');
            const buffers = chunks.map(chunk => chunk.binary);

            const blob = new Blob(buffers);
            await db.files_chunks.where('file').equals(file.file).delete();

            await db.files_cache.put({
                path: path,
                file: file.file,
                file_blob: blob
            });

            downloadBlob(blob, file.name);
        } catch (err) {
            console.error('❌ Ошибка при скачивании файла:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const plural = (n: number, one: string, few: string, many: string) => {
        const mod100 = n % 100;
        const mod10 = n % 10;
        if (mod100 > 10 && mod100 < 20) return many;
        if (mod10 > 1 && mod10 < 5) return few;
        if (mod10 === 1) return one;
        return many;
    };

    return (
        <div className={classNames('UserContent-File', className)}>
            <HandleFileIcon fileName={file.name} />
            <div className="FileInfo">
                <div className="FileName">{file.name}</div>
                <div className="FileSize"><HandleFileSize bytes={file.size} /></div>
            </div>
            {filesCount > 1 ? (
                <div className="FilesCount">
                    {filesCount} {plural(filesCount, t('files'), t('files_plural_1'), t('files_plural_2'))}
                </div>
            ) : (
                downloadButton && (
                    <button
                        onClick={download}
                        disabled={isLoading}
                    >
                        {isLoading ? `${t('loading')}... (${Math.round(progress / 1024)} KB)` : t('download')}
                    </button>
                )
            )}
        </div>
    );
};

export default UserContentFile;
