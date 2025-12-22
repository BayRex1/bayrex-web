const CURRENT_VERSION = 2.7;

const BaseConfig = {
    session: {
        name: `Element Web ${CURRENT_VERSION}`,
        device: 'browser',
    },
    captcha: true,
    domains: {
        client: 'https://bayrex-web.onrender.com',
        base: 'https://bayrex-web.onrender.com',
        share: 'https://bayrex-web.onrender.com',
        ws: [
            'wss://bayrex-backend.onrender.com/user_api'  // ← ИСПРАВЛЕНО!
        ],
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
                    'Полностью переделана система уведомлений...',
                    // ... остальной текст
                ]
            }
        ]
    }
};

export default BaseConfig;
