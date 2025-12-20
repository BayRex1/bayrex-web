const HandleApp = ({ app, editApp }) => {
    return (
        <button onClick={() => { editApp(app) }} className="UI-App">
            <div className="UI-AppIcon">
                {
                    app.icon ? (
                        <img src={app.icon} />
                    ) : (
                        <img src="static_sys/Images/All/AppIcon.png" />
                    )
                }
            </div>
            <div className="Name">{app.name}</div>
        </button>
    )
}

export default HandleApp;
