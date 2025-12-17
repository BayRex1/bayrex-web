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
            <div className="UI-AD-T">Подпишитесь на телеграм канал автора сайта</div>
            <div className="UI-AD_C_BOTTOM">
                <a className="UI-AD_BTN" href="https://t.me/XaromieChannel">
                    Перейти
                </a>
            </div>
        </div>
    );
};