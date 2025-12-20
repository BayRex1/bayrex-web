import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddButton } from '../../UIKit';
import './index.scss';
import AddApp from './Components/AddApp';
import { Window } from '../../System/Elements/Modal';
import HandleApp from './Components/HandleApp';
import EditApp from './Components/EditApp';
import { useWebSocket } from '../../System/Context/WebSocket';
import { PreloadApps } from '../../System/UI/Preload';

const Apps = () => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const [appsLoaded, setAppsLoaded] = useState(false);
    const [myApps, setMyApps] = useState<any>([]);

    // Окно
    const [windowOpen, setWindowOpen] = useState<boolean>(false);
    const [windowTitle, setWindowTitle] = useState<string>('');
    const [windowContent, setWindowContent] = useState<ReactNode>('');
    const [windowContentClass, setWindowContentClass] = useState<string>('');

    useEffect(() => {
        wsClient.send({
            type: 'apps',
            action: 'load_apps',
        }).then((res: any) => {
            if (res.status ==='success') {
                setAppsLoaded(true);
                setMyApps(res.apps);
            }
        })
    }, [])

    const openAddApp = () => {
        setWindowOpen(true);
        setWindowTitle(t('add_app'));
        setWindowContent(<AddApp />);
        setWindowContentClass('MultiForm');
    }

    const editApp = (app: any) => {
        setWindowOpen(true);
        setWindowTitle(t('edit_app'));
        setWindowContent(<EditApp app={app} />);
        setWindowContentClass('MultiForm EditApp');
    }

    return (
        <>
            <div className="UI-ScrollView">
                <AddButton
                    title={t('add_app')}
                    onClick={openAddApp}
                    className="UI-B_FIRST"
                />
                <div className="AppsList">
                    {
                        appsLoaded ? (
                            myApps.length > 0 ? (
                                myApps.map((app, i) => (
                                    <HandleApp
                                        key={i}
                                        app={app}
                                        editApp={editApp}
                                    />
                                ))
                            ) : (
                                <div className="UI-ErrorMessage">{t('ups')}</div>
                            )
                        ) : (
                            <PreloadApps />
                        )
                    }
                </div>
            </div>
            <Window
                title={windowTitle}
                content={windowContent}
                contentClass={windowContentClass}
                style={{ width: 'fit-content' }}
                isOpen={windowOpen}
                setOpen={setWindowOpen}
            />
        </>
    )
}

export default Apps;
