import { useModalsStore } from '../../../Store/modalsStore';
import FilesModal from '../../../UIKit/Components/Layout/FilesModal';
import UserContentFile from './UserContentFile';

const UserContentFiles = ({ files, path }) => {
    const openModal = useModalsStore((state) => state.openModal);

    const handleOpenModal = () => {
        if (files.length <= 1) return;

        openModal({
            type: 'routed',
            props: {
                title: `Файлы (${files.length})`,
                children: <FilesModal files={files} filesPath={path} />
            }
        });
    };

    return (
        <div className="UserContent-Stack" onClick={handleOpenModal}>
            <div className="Stack"
                style={{
                    zIndex: 1,
                    marginTop: files.length > 1 ? 10 : 0,
                    cursor: files.length > 1 ? 'pointer' : 'default'
                }}
            >
                {files[0] && (
                    <UserContentFile
                        file={files[0]}
                        filesCount={files.length}
                        path={path}
                        downloadButton={files.length < 2}
                        className="Layer"
                    />
                )}
                {files.length > 1 &&
                    [1, 2, 3].map((n) => (
                        <div
                            key={`shadow-${n}`}
                            className="Layer ShadowLayer"
                            style={{
                                transform: `translateY(-${(n + 0.5) * 3}px) scale(${1 - n * 0.05})`,
                                zIndex: -1,
                                opacity: 0.5
                            }}
                        />
                    ))}
            </div>
        </div>
    );
};

export default UserContentFiles; 