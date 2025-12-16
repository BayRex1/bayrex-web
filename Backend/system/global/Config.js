    const Config = {
    ELEMENT_DATABASE: {
        HOST: 'MySQL-8.2',
        NAME: 'sn',
        USER: 'root',
        PASSWORD: ''
    },
    MESSENGER_DATABASE: {
        HOST: 'MySQL-8.2',
        NAME: 'sn_messenger',
        USER: 'root',
        PASSWORD: ''
    },
    APPS_DATABASE: {
        HOST: 'MySQL-8.2',
        NAME: 'sn_apps',
        USER: 'root',
        PASSWORD: ''
    },
    TELEGRAM: {
        BOT_TOKEN: '8392384070:AAG0J2WLm8EGtilQI2Cp-sOTHBSmFxK28AY',
        CHAT_ID: '-4704543688'
    },
    VAPID: {
        PUBLIC_KEY: 'BP2xfmqDnX7-yoDsZQxgHt8aTd7fSRhLno0-fPwpGoglILifPqzVmEo0OLNYILeU0qVkC5qo_rLhzzcrBh_EIIs',
        PRIVATE_KEY: 'YRA0u3DtdvUpV-aGr0wBewoy-n3MWdwdGYy8pyffxdI'
    },
    PORT: 8080,
    USE_HTTPS: false,
    SSL: {
        KEY: '',
        CERT: '',
        CA: ''
    },
    LIMITS: {
        DEFAULT: {
            MAX_AVATAR_SIZE: 4 * 1024 * 1024,
            MAX_COVER_SIZE: 4 * 1024 * 1024,
            AUDIO_SIZE: 10 * 1024 * 1024,
            AUDIO_COVER_SIZE: 4 * 1024 * 1024
        },
        GOLD: {
            MAX_AVATAR_SIZE: 8 * 1024 * 1024,
            MAX_COVER_SIZE: 8 * 1024 * 1024,
            AUDIO_SIZE: 20 * 1024 * 1024
        },
        MAX_USER_SPACE: 200 * 1024 * 1024,
        MAX_FILE_SIZE: 5 * 1024 * 1024,
        MAX_APP_ICON_SIZE: 2 * 1024 * 1024,
        MAX_BLOCKED_USERS: 100,
        MAX_GROUPS: 100,
        MAX_PLAYLISTS: 100,
        MAX_CHANNELS: 20
    },
    REGISTRATION: true,
    CAPTCHA: true,
    CAPTCHA_URL: 'https://hcaptcha.com/siteverify',
    CAPTCHA_KEY: 'ES_8227cca58dc8405e80c8623dacc584ab',
    CHUNK_SIZE: 10 * 1024,
    EBALLS: {
        POST: {
            AMOUNT: 0.005,
            COOLDOWN_MS: 120_000
        },
        COMMENT: {
            AMOUNT: 0.003,
            COOLDOWN_MS: 120_000
        },
        SONG: {
            AMOUNT: 0.01,
            COOLDOWN_MS: 60_000
        },
    },
}

export default Config;