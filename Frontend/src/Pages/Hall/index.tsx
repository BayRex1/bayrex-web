import { useEffect, useState } from 'react';
import { useWebSocket } from '../../System/Context/WebSocket';
import { Avatar, Block, Name } from '../../UIKit';
import './Hall.scss';
import { HandleText } from '../../System/Elements/Handlers';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

interface User {
    id: string;
    name: string;
    username: string;
    avatar: string;
    icons: any;
    eballs: number;
}

const Hall = () => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const [users, setUsers] = useState<User[]>([]);
    const [startIndex, setStartIndex] = useState(0);

    const loadUsers = () => {
        wsClient.send({
            type: 'social',
            action: 'eball/hall/load',
            payload: { start_index: startIndex }
        }).then((res) => {
            if (res.status === 'success') {
                setUsers(res.users);
            }
        })
    }

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div className="UI-ScrollView">
            <div className="Leaderboard UI-B_FIRST">
                <div className="Leaderboard-Title">
                    <div className="Title">
                        {t('nav_hall')}
                    </div>
                </div>
                <div className="Leaderboard-Podium">
                    <div className="Podium-Second">
                        <div className="Podium-User">
                            <NavLink to={`/e/${users[1]?.username}`}>
                                <Avatar
                                    name={users[1]?.name}
                                    avatar={users[1]?.avatar}
                                />
                            </NavLink>
                            <div className="User-Name">
                                <HandleText text={users[1]?.name || t('second_place')} />
                            </div>
                        </div>
                        <div className="Podium-Place">
                            <div className="UI-Eball">E</div>
                            <div className="Count">
                                {users[1]?.eballs}
                            </div>
                        </div>
                    </div>
                    <div className="Podium-First">
                        <div className="Podium-User">
                            <NavLink to={`/e/${users[0]?.username}`}>
                                <Avatar
                                    name={users[0]?.name}
                                    avatar={users[0]?.avatar}
                                />
                            </NavLink>
                            <div className="User-Name">
                                <HandleText text={users[0]?.name || t('first_place')} />
                            </div>
                        </div>
                        <div className="Podium-Place">
                            <div className="UI-Eball">E</div>
                            <div className="Count">
                                {users[0]?.eballs}
                            </div>
                        </div>
                    </div>
                    <div className="Podium-Third">
                        <div className="Podium-User">
                            <NavLink to={`/e/${users[2]?.username}`}>
                                <Avatar
                                    name={users[2]?.name}
                                    avatar={users[2]?.avatar}
                                />
                            </NavLink>
                            <div className="User-Name">
                                <HandleText text={users[2]?.name || t('third_place')} />
                            </div>
                        </div>
                        <div className="Podium-Place">
                            <div className="UI-Eball">E</div>
                            <div className="Count">
                                {users[2]?.eballs}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="Users">
                {users.slice(3).map((user: User) => (
                    <Block className="User" key={user.id}>
                        <NavLink to={`/e/${user.username}`}>
                            <Avatar
                                name={user.name}
                                avatar={user.avatar}
                            />
                        </NavLink>

                        <div className="UserData">
                            <NavLink to={`/e/${user.username}`}>
                                <Name
                                    name={user.name}
                                    icons={user.icons}
                                />
                            </NavLink>
                            <div className="Username">
                                @{user.username}
                            </div>
                        </div>

                        <div className="EballCount">
                            <div className="Count">{user.eballs}</div>
                            <div className="UI-Eball">E</div>
                        </div>
                    </Block>
                ))}
            </div>
        </div>
    )
}

export default Hall;
