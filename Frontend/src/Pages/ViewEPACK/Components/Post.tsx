import { NavLink } from 'react-router-dom';
import { HandleFileIcon, HandleFileSize, HandleTimeAge } from '../../../System/Elements/Handlers';
import { I_COMMENT, I_DISLIKE, I_LIKE } from '../../../System/UI/IconPack';
import Avatar from './Avatar';
import { Block, Text } from '../../../UIKit';

const Post = ({ post }) => {
    const {
        author,
        date,
        text,
        content_type,
        content,
        stats,
    } = post;

    return (
        <Block className="EPACK-Post Post">
            <div className="TopBar">
                <div className="Info">
                    <NavLink to={`/e/${author.username}`}>
                        <Avatar
                            avatar={author.avatar}
                            name={author.name}
                        />
                    </NavLink>
                    <div className="InfoBody">
                        <div className="UI-NameBody">
                            <div className="Name">{author.name}</div>
                        </div>
                        <div className="Date">
                            <HandleTimeAge inputDate={date} />
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    margin: '7px 0px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5
                }}
            >
                <Text text={text} />

                {content_type?.toLowerCase() === 'image' && content?.base64 && (
                    <div
                        className="UserContent-Image"
                        img-name={content.file_name}
                        img-size={content.file_size}
                    >
                        <img className="IMG" src={`data:image/jpeg;base64,${content.base64}`} alt={content.file_name} />
                        <div className="Blur"></div>
                        <img className="BlurIMG" src={`data:image/jpeg;base64,${content.base64}`} alt={content.file_name} />
                    </div>
                )}

                {content_type?.toLowerCase() === 'file' && content?.base64 && (
                    <div className="UserContent-File">
                        <HandleFileIcon fileName={content.file_name} />
                        <div className="FileInfo">
                            <div className="FileName">{content.file_name}</div>
                            <div className="FileSize">
                                <HandleFileSize bytes={content.file_size} />
                            </div>
                            <a
                                href={`data:application/octet-stream;base64,${content.base64}`}
                                download={content.file_name}
                            >
                                Скачать
                            </a>
                        </div>
                    </div>
                )}
            </div>

            <div className="Interaction">
                <div className="InteractionCount">
                    <I_LIKE />
                    <div className="Likes">{stats.likes}</div>
                </div>
                <div className="InteractionCount">
                    <I_DISLIKE />
                    <div className="Dislikes">{stats.dislikes}</div>
                </div>
                {stats.comments !== null && (
                    <div className="InteractionCount">
                        <I_COMMENT />
                        <div className="Comments">{stats.comments}</div>
                    </div>
                )}
            </div>
        </Block>
    );
}

export default Post;
