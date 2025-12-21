import { useTranslation } from 'react-i18next';
import { Switch } from '../../../UIKit';
import useSettingsStore from '../../../Store/settingsStore';

const AdvancedSettings = () => {
    const { t } = useTranslation();

    const {
        showOnlineUsers,
        doubleClickLike,
        autoVideoDownload,
        hideProfileAnimation,
        setShowOnlineUsers,
        setDoubleClickLike,
        setAutoDownload,
        setHideProfileAnimation
    } = useSettingsStore();

    return (
        <div className="UI-Block Settings-Advanced">
            <div className="Parameter">
                {t('settings.advanced.show_online_users')}
                <Switch
                    checked={showOnlineUsers}
                    onChange={(e) => setShowOnlineUsers(e.target.checked)}
                />
            </div>

            <div className="Parameter">
                {t('settings.advanced.double_click_like')}
                <Switch
                    checked={doubleClickLike}
                    onChange={(e) => setDoubleClickLike(e.target.checked)}
                />
            </div>

            <div className="Parameter">
                {t('settings.advanced.auto_download_video')}
                <Switch
                    checked={autoVideoDownload}
                    onChange={(e) => setAutoDownload(e.target.checked)}
                />
            </div>

            <div className="Parameter">
                {t('settings.advanced.profile_hide_anim')}
                <Switch
                    checked={hideProfileAnimation}
                    onChange={(e) => setHideProfileAnimation(e.target.checked)}
                />
            </div>
        </div>
    );
};

export default AdvancedSettings;
