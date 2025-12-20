import { useEffect, useState } from 'react';
import { useWebSocket } from '../../../System/Context/WebSocket';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

const HandleUpdate = ({ type, update }) => {
    const { t } = useTranslation();

    return (
        <div className="Info-UpdateBlock">
            <div className="Title">{type === 'release' ? t('update') : t('beta')} {update.version}</div>
            <div className="UpdateContent">
                {
                    Array.isArray(update.content) ? (
                        update.content.map((section, i) => (
                            <div key={i}>
                                {
                                    section.title && (
                                        <div
                                            style={{
                                                fontSize: '0.95em',
                                                opacity: 0.9,
                                                marginTop: 5,
                                                marginBottom: 5
                                            }}
                                        >
                                            {section.title}:
                                        </div>
                                    )
                                }
                                {section.changes.map((change, i) => (
                                    <div key={i}
                                        style={{ display: 'flex' }}
                                    >
                                        <div style={{ color: 'var(--ACCENT_COLOR)', opacity: 0.7, marginRight: 5 }}>•</div>
                                        {change}
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div>
                            {
                                update.content.title && (
                                    <div
                                        style={{
                                            fontSize: '0.95em',
                                            opacity: 0.9,
                                            marginTop: 5,
                                            marginBottom: 5
                                        }}
                                    >
                                        {update.content.title}:
                                    </div>
                                )
                            }
                            {update.content.changes.map((change, i) => (
                                <div key={i}
                                    style={{ display: 'flex' }}
                                >
                                    <div style={{ color: 'var(--ACCENT_COLOR)', opacity: 0.7, marginRight: 5 }}>•</div>
                                    {change}
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>
        </div>
    )
}

const Releases = () => {
    const { wsClient } = useWebSocket();
    const [updates, setUpdates] = useState([]);

    useEffect(() => {
        wsClient.send({
            type: 'system',
            action: 'get_updates',
            updates_type: 'release'
        }).then((data) => {
            if (data.updates_type === 'release') {
                setUpdates(data.updates);
            }
        })
    }, [])

    return updates.map((update, i) => <HandleUpdate key={i} type="release" update={update} />)
}

const Beta = () => {
    const { wsClient } = useWebSocket();
    const [updates, setUpdates] = useState([]);

    useEffect(() => {
        wsClient.send({
            type: 'system',
            action: 'get_updates',
            updates_type: 'beta'
        }).then((data) => {
            if (data.updates_type === 'beta') {
                setUpdates(data.updates);
            }
        })
    }, [])

    return updates.map((update, i) => <HandleUpdate key={i} type="beta" update={update} />)
}

const Updates = () => {
    const [tabActive, setTabActive] = useState(0);

    return (
        <div className="UI-ScrollView">
            <div className="UI-Block Info-Block UI-B_FIRST">
                <div className="UI-Title">
                    История обновлений
                </div>
                <div className="UI-Tabs">
                    <button className={classNames('Tab', tabActive === 0 && 'ActiveTab')} onClick={() => setTabActive(0)}>
                        Обновления
                    </button>
                    <button className={classNames('Tab', tabActive === 1 && 'ActiveTab')} onClick={() => setTabActive(1)}>
                        Бета-версии
                    </button>
                </div>
                <div>
                    {tabActive === 0
                        ? <Releases />
                        : <Beta />
                    }
                </div>
            </div>
        </div>
    );
};

export default Updates;
