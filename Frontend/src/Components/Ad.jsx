import { useAuth } from '../System/Hooks/useAuth';

export const DefaultBanner = () => {
    const { accountData } = useAuth();

    if (accountData?.gold_status) {
        return null;
    }

    return (
        <div className="UI-AD_N2-B">
            <div className="UI-AD_C_TOP">
                <div className="UI-AD_TITLE">Реклама</div>
            </div>
            <div className="UI-AD-T">Подпишитесь на телеграм канал автора мессенджера</div>
            <div className="UI-AD_C_BOTTOM">
                <a className="UI-AD_BTN" href="https://t.me/bayrex_web">
                    Перейти
                </a>
            </div>
        </div>
    );

};
