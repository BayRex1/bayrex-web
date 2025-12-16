import { useEffect, useState } from 'react';
import { PreloadGoldUsers } from '../UI/Preload';
import { HandleGoldUser } from './Handlers';
import { useWebSocket } from '../Context/WebSocket';

const GoldUsers = () => {
    const { wsClient } = useWebSocket();
    const [goldUsers, setGoldUsers] = useState([]);

    useEffect(() => {
        wsClient.send({
            type: 'system',
            action: 'get_gold_users'
        }).then((res) => {
            if (res.users && Array.isArray(res.users)) {
                setGoldUsers(res.users.sort((a, b) => b.subscribers - a.subscribers));
            }
        })
    }, []);

    return goldUsers.length > 0 ? (
        goldUsers.map((user, i) => <HandleGoldUser key={i} user={user} />)
    ) : (
        <PreloadGoldUsers />
    );
};

export default GoldUsers;
