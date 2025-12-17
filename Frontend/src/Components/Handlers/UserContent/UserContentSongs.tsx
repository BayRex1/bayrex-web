import { useModalsStore } from '../../../Store/modalsStore';
import SongsModal from '../../../UIKit/Components/Layout/SongsModal';
import UserContentAudio from './UserContentAudio';

const UserContentSongs = ({ songs, path }) => {
    const openModal = useModalsStore((state) => state.openModal);

    const handleOpenModal = () => {
        openModal({
            type: 'routed',
            props: {
                title: `Песни (${songs.length})`,
                children: <SongsModal songs={songs} />
            }
        });
    };

    const handleClick = () =>{ 
        if (songs.length > 1) {
            handleOpenModal();
        }
    }

    return (
        <div className="UserContent-Stack" onClick={handleClick}>
            <div className="Stack"
                style={{
                    zIndex: 1,
                    marginTop: songs.length > 1 ? 10 : 0,
                    cursor: songs.length > 1 ? 'pointer' : 'default'
                }}
            >
                {songs[0] && (
                    <UserContentAudio
                        song={songs[0]}
                        count={songs.length}
                        canPay={songs.length < 2}
                        className="Layer"
                    />
                )}
                {songs.length > 1 &&
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

export default UserContentSongs; 