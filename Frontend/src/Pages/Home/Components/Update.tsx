import BaseConfig from '../../../Configs/Base';

const Update = () => {
    return (
        <div className="UI-Block UI-B_FIRST">
            <div className="UI-Title">Обновление {BaseConfig.update.version}</div>
            <div className="UI-B_CONTENT">
                {BaseConfig.update.content.map((section, index) => (
                    <div key={index}>
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
                        {section.changes.map((change, i) => (
                            <div key={i}
                                style={{ display: 'flex' }}
                            >
                                <div style={{ color: 'var(--ACCENT_COLOR)', opacity: 0.7, marginRight: 5 }}>•</div>
                                {change}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Update;
