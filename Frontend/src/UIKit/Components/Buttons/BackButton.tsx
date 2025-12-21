import { useTranslation } from 'react-i18next';
import { I_BACK } from '../../../System/UI/IconPack';
import { memo } from 'react';

const BackButton = ({ onClick, style }: any) => {
    const { t } = useTranslation();

    return (
        <button onClick={onClick} style={style} className="UI-BackButton">
            <I_BACK />
            {t('back')}
        </button>
    )
}

export default memo(BackButton);