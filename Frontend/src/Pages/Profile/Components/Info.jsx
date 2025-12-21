import { useTranslation } from 'react-i18next';
import { HandleTimeAge } from '../../../System/Elements/Handlers';

const HandleProfileDate = ({ date }) => {
    const dateObj = new Date(date);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;

    return formattedDate;
};

const Info = ({ profileData }) => {
    const { t } = useTranslation();

    return (
        <div id="ProfileInfo">
            <div className="UI-Block">
                <div>
                    {t('profile_date')} <HandleProfileDate date={profileData.create_date} /> <div style={{ opacity: 0.8, display: 'inline' }}>(<HandleTimeAge inputDate={profileData.create_date} showDetailed={true} />)</div>
                </div>
            </div>
        </div>
    )
}

export default Info;
