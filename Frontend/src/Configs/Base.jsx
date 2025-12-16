const CURRENT_VERSION = 2.7;
// const WINDOWS_CURRENT_VERSION = '2.7.0';

const BaseConfig = {
    session: {
        name: `Element Web ${CURRENT_VERSION}`,
        device: 'browser',
        // name: `Element Windows ${WINDOWS_CURRENT_VERSION}`,
        // device: 'windows_app'
    },
    captcha: true,
    domains: {
        client: 'https://elemsocial.com',
        base: 'https://elemsocial.com',
        share: 'https://share.elemsocial.com',
        ws: [
            'wss://bpws.elemsocial.com/user_api',
            'wss://ws.elemsocial.com:8880/user_api'
        ],
        // client: 'http://localhost:3000',
        // base: 'http://localhost:3000',
        // share: 'https://share.elemsocial.com',
        // ws: [
        //     'ws://localhost:8080/user_api',
        // ],
    },
    vapid: {
        public_key: 'BP2xfmqDnX7-yoDsZQxgHt8aTd7fSRhLno0-fPwpGoglILifPqzVmEo0OLNYILeU0qVkC5qo_rLhzzcrBh_EIIs'
    },
    update: {
        version: CURRENT_VERSION,
        content: [
            {
                title: 'Общие изменения',
                changes: [
                    'Полностью переделана система уведомлений, а так же сами уведомления перенесены в отдельную страницу.',
                    'Значительно ускорена загрузка профилей - оптимизированы запросы к базе данных, убраны узкие места производительности.',
                    'Улучшена и оптимизирована загрузка видео.',
                    'Обновлена публикация видео/файлов/музыки в постах.',
                    'Исправлена обработка JSON контента в постах - больше нет потери данных при загрузке.',
                    'Исправлено сохранение настройки цензуры в постах - теперь деликатный контент корректно отображается.',
                    'Добавлены переводы Е-Баллов между пользователями.',
                    'Добавлен кошелёк.',
                    'Добавлены подарки.',
                    'Добавлена модерация, а именно: жалобы на посты/комментарии/пользователей/каналы.',
                    'Добавлены «Продвинутые настройки».',
                    'Обновлена система диалоговых окон, удалены старые диалоговые окна с настроек.',
                    'Проведена оптимизация контента в постах, а так же интерфейс и оформление постов.',
                    'Улучшен и оптимизирован интерфейс.',
                    'Добавлена экспериментальная тема «Жидкое стекло».',
                    'При загрузке сайта теперь показывает домен к которому идёт попытка подключения.',
                    'Максимальная длинна текста в постах/комментариях теперь 30 000 символов!',
                    'Исправление ошибок.',
                    'Незначительные улучшения.'
                ]
            }
        ]
    }
};

export default BaseConfig;
