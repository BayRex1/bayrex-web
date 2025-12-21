import UserContentFile from '../../../Components/Handlers/UserContent/UserContentFile';

interface FilesModalProps {
    files: any[];
    filesPath: string;
}

const FilesModal: React.FC<FilesModalProps> = ({ files, filesPath }) => {

    return (
        <>
            {files.map((file, i) => (
                <UserContentFile
                    key={i}
                    file={file}
                    filesCount={0}
                    path={filesPath}
                    downloadButton={true}
                    className="UI-Block"
                />
            ))}
        </>
    );
};

export default FilesModal;