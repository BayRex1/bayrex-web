import AddLink from '../Modals/AddLink';
import AdvancedSettings from '../Modals/AdvancedSettings';
import Authors from '../Modals/Authors';
import ChangeEmail from '../Modals/ChangeEmail';
import ChangeLanguage from '../Modals/ChangeLanguage';
import ChangePassword from '../Modals/ChangePassword';
import ChangeUsername from '../Modals/ChangeUsername';
import EditLink from '../Modals/EditLink';
import Sessions from '../Modals/Sessions';
import Status from '../Modals/Status';
import Storage from '../Modals/Storage';
import MyReports from '../Modals/MyReports';
import SubmitAppealModal from '../Modals/SubmitAppealModal';
import MyAppealsListModal from '../Modals/MyAppealsListModal';

const getModal = (type, t) => {
    const map = {
        add_link: {
            title: 'Добавить ссылку',
            Element: AddLink,
        },
        edit_link: {
            title: 'Редактировать ссылку',
            Element: EditLink,
        },
        change_username: {
            title: 'Изменение ун. имени',
            Element: ChangeUsername,
        },
        change_password: {
            title: 'Смена пароля',
            Element: ChangePassword,
        },
        change_email: {
            title: 'Смена почты',
            Element: ChangeEmail,
        },
        sessions: {
            title: 'Мои сессии',
            Element: Sessions,
        },
        change_language: {
            title: 'Изменение языка',
            Element: ChangeLanguage,
        },
        authors: {
            title: 'Авторы',
            Element: Authors,
        },
        profile_status: {
            title: 'Мой статус',
            Element: Status,
        },
        storage: {
            title: 'Управление хранилищем',
            Element: Storage,
        },
        my_reports: {
            title: 'Мои жалобы',
            Element: MyReports,
        },
        advanced: {
            title: t('settings.advanced.title'),
            Element: AdvancedSettings
        },
        submit_appeal: {
            title: 'Подача апелляции',
            Element: SubmitAppealModal
        },
        my_appeals: {
            title: 'Мои апелляции',
            Element: MyAppealsListModal
        }
    };

    return map[type];
};

export default getModal;
