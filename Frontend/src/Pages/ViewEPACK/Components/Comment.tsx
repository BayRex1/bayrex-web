import { NavLink } from 'react-router-dom';
import Avatar from './Avatar';
import { HandleTimeAge } from '../../../System/Elements/Handlers';
import { Block, Text } from '../../../UIKit';

const Comment = ({ comment }) => {
    const {
        author,
        date,
        text
    } = comment;

    return (
        <Block className="Comment">
            <div className="TopBar">
                <div className="Info">
                    <NavLink to={`/e/${author.username}`}>
                        <Avatar
                            avatar={author.avatar}
                            name={author.name}
                        />
                    </NavLink>
                    <div className="InfoBody">
                        <NavLink to={`/e/${author.username}`} className="Name">
                            {author.name}
                        </NavLink>
                        <div className="Date">
                            <HandleTimeAge inputDate={date} />
                        </div>
                    </div>
                </div>
            </div>
            <div
                style={{
                    marginTop: 7,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5
                }}
            >
                <Text text={text} />
            </div>
        </Block>
    );
};

export default Comment;
