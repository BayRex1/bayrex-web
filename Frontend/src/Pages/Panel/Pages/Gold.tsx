import { useEffect, useState } from 'react';
import { PreloadGoldUsers } from '../../../System/UI/Preload';
import { HandleGoldUser } from '../../../System/Elements/Handlers';
import { useWebSocket } from '../../../System/Context/WebSocket';

const HandleCode = ({ code }) => {
    return (
        <div className={`Dashboard-SUB_KEY ${code.activated === true ? 'Dashboard-SK_A' : 'Dashboard-SK_NA'}`}>{code.key}</div>
    )
}

const Gold = () => {
    const { wsClient } = useWebSocket();
    const [statistic, setStatistic] = useState<any>({});
    const [goldUsersLoaded, setGoldUsersLoaded] = useState<boolean>(false);
    const [goldUsers, setGoldUsers] = useState<any>([]);
    const [codes, setCodes] = useState<any>([]);

    const loadGoldUsers = () => {
        wsClient.send({
            type: 'system',
            action: 'get_gold_users'
        }).then((res) => {
            if (res.users && Array.isArray(res.users)) {
                setGoldUsers(res.users.sort((a, b) => b.subscribers - a.subscribers));
            }
            setGoldUsersLoaded(true);
        })
    }

    const loadCodes = () => {
        wsClient.send({
            type: 'social',
            action: 'dashboard/gold/load_codes'
        }).then((res) => {
            console.log(res);
            if (res.status === 'success') {
                setCodes(res.codes);
            }
        })
    }

    useEffect(() => {
        wsClient.send({
            type: 'social',
            action: 'dashboard/gold/load_statistic'
        }).then((res) => {
            if (res.status === 'success') {
                setStatistic(res.statistic);
            }
        });
        loadGoldUsers();
        loadCodes();
    }, [])

    const generateCode = () => {
        wsClient.send({
            type: 'social',
            action: 'dashboard/gold/generate_code'
        }).then(() => {
            loadCodes();
        })
    }

    const recountGold = () => {
        wsClient.send({
            type: 'social',
            action: 'dashboard/gold/recount_users'
        }).then(() => {
            loadGoldUsers();
            setGoldUsersLoaded(false);
        })
    }

    return (
        <>
            <div className="Dashboard-Blocks UI-B_FIRST">
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Пользователей с активной подпиской</div>
                    <div className="Dashboard-B_Count">
                        {statistic.active_subscribers}
                    </div>
                </div>
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Подписок активировано</div>
                    <div className="Dashboard-B_Count">
                        {statistic.activations}
                    </div>
                </div>
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Сгенерировано кодов</div>
                    <div className="Dashboard-B_Count">
                        {statistic.keys}
                    </div>
                </div>
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Не активированных кодов</div>
                    <div className="Dashboard-B_Count">
                        {statistic.non_activated_keys}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex' }} className="UI-Block">
                <div className="Dashboard-BL_CNT">
                    <div className="UI-Title">Ключи для активации</div>
                    <button onClick={generateCode} className="Dashboard-SUB_BTN">Генерировать ключ</button>
                    <div className="Dashboard-SUB_LIST">
                        {
                            codes.length > 0 && (
                                codes.map((code) => (
                                    <HandleCode key={code.id} code={code} />
                                ))
                            )
                        }
                    </div>
                </div>
                <div className="Dashboard-BL_CNT">
                    <div className="UI-Title">Пользователи с подпиской</div>
                    <button
                        onClick={recountGold}
                        className="Dashboard-SUB_BTN"
                    >
                        Пересчитать
                    </button>
                    <div className="Dashboard-SUB_LIST">
                        {
                            goldUsersLoaded ? (
                                goldUsers.length > 0 && (
                                    goldUsers.map((user, i) => (
                                        <HandleGoldUser key={i} user={user} />
                                    ))
                                )
                            ) : (
                                <PreloadGoldUsers />
                            )
                        }
                    </div>
                </div>
            </div>
        </>
    )
}

export default Gold;
