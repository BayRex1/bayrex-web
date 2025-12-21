import { useTranslation } from "react-i18next";

const ChangeLanguage = () => {
    const { t, i18n } = useTranslation();
    const languages = [
        {
            code: 'en',
            name: t('lang_en'),
            icon: '1f1ec-1f1e7.png'
        },
        {
            code: 'isv',
            name: t('lang_isv'),
            icon: 'ISV.png'
        },
        {
            code: 'ru',
            name: t('lang_ru'),
            icon: '1f1f7-1f1fa.png'
        },
        {
            code: 'ua',
            name: t('lang_ua'),
            icon: '1f1fa-1f1e6.png'
        },
        {
            code: 'by',
            name: t('lang_by'),
            icon: '1f1e7-1f1fe.png'
        },
        {
            code: 'pl',
            name: t('lang_pl'),
            icon: '1f1f5-1f1f1.png'
        },
        {
            code: 'kz',
            name: t('lang_kz'),
            icon: '1f1f0-1f1ff.png'
        },
        {
            code: 'tr',
            name: t('lang_tr'),
            icon: '1f1f9-1f1f7.png'
        },
        {
            code: 'bg',
            name: t('lang_bg'),
            icon: '1f1e7-1f1ec.png'
        },
        {
            code: 'de',
            name: t('lang_de'),
            icon: '1f1e9-1f1ea.png'
        },
        {
            code: 'ja',
            name: t('lang_ja'),
            icon: '1f1ef-1f1f5.png'
        },
        {
            code: 'zh',
            name: t('lang_zh'),
            icon: '1f1e8-1f1f3.png'
        },
        {
            code: 'yi',
            name: t('lang_yi'),
            icon: '1f1ff-1f1e6.png'
        }
    ]

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    return (
        <>
            <div className="UI-PartitionName">{t('lang_warning')}</div>
            {languages.map((lang, i) => (
                <button
                    key={i}
                    onClick={() => changeLanguage(lang.code)}
                    className={`Settings-ChangeLanguage ${i18n.language === lang.code ? 'Settings-LanguageSelected' : ''}`}
                >
                    <img
                        src={`/static_sys/Images/Emoji/Apple//${lang.icon}`}
                        alt={lang.code}
                        draggable={false}
                    />
                    {lang.name}
                </button>
            ))}
        </>
    );
}

export default ChangeLanguage;