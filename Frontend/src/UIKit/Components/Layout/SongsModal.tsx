import '../../../System/UI/ModalMusic.scss';
import UserContentAudio from '../../../Components/Handlers/UserContent/UserContentAudio';

interface SongsModalProps {
    songs: any[];
}

const SongsModal: React.FC<SongsModalProps> = ({ songs }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {songs.map((song, i) => (
                <UserContentAudio
                    key={i}
                    song={song}
                    canPay={true}
                    className="UI-Block"
                />
            ))}
        </div>
    );
};

export default SongsModal; 