import { useTranslation } from 'react-i18next';
import { I_POST, I_COMMENT, I_MUSIC } from '../../../System/UI/IconPack';

const EarnItem = ({ icon: Icon, title, amount }) => (
    <div className="Earn-Item">
        <div className="Earn-Icon">
            <Icon />
        </div>
        <div className="Earn-Info">
            <div className="Earn-Title">{title}</div>
            <div className="Earn-Amount">
                <div className="UI-Eball">E</div>
                {amount}
            </div>
        </div>
    </div>
);

const EarnInfo = () => {
    const { t } = useTranslation();

    const earnItems = [
        {
            icon: I_POST,
            title: t('balance.earn.items.post'),
            amount: t('balance.earn.amounts.post')
        },
        {
            icon: I_COMMENT,
            title: t('balance.earn.items.comment'),
            amount: t('balance.earn.amounts.comment')
        },
        {
            icon: I_MUSIC,
            title: t('balance.earn.items.track'),
            amount: t('balance.earn.amounts.track')
        }
    ];

    return (
        <>
            {earnItems.map((item, index) => (
                <EarnItem key={index} {...item} />
            ))}
            <div className="Earn-Description">
                {t('balance.earn.description')}
            </div>
        </>
    );
};

export default EarnInfo; 
