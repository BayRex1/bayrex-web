const Config = {
  // === ОДНА БАЗА ДЛЯ ВСЕГО ===
  DATABASE: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 3306,
    NAME: process.env.DB_NAME || 'defaultdb',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    SSL: process.env.DB_SSL === 'true',
    
    TABLE_PREFIXES: {
      main: '',
      messenger: 'msg_',
      apps: 'app_'
    }
  },
  
  // === ДЛЯ СОВМЕСТИМОСТИ СО СТАРЫМ КОДОМ ===
  ELEMENT_DATABASE: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 3306,
    NAME: process.env.DB_NAME || 'defaultdb',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    SSL: process.env.DB_SSL === 'true'
  },
  
  MESSENGER_DATABASE: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 3306,
    NAME: process.env.DB_NAME || 'defaultdb',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    SSL: process.env.DB_SSL === 'true'
  },
  
  APPS_DATABASE: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || 3306,
    NAME: process.env.DB_NAME || 'defaultdb',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    SSL: process.env.DB_SSL === 'true'
  },
  
  // === REDIS (ОТКЛЮЧЕН) ===
  REDIS: {
    enabled: false,
    host: 'localhost',
    port: 6379,
    retryDelayOnFailover: 1000,
    maxRetriesPerRequest: 0
  },
  
  // === TELEGRAM (ОТКЛЮЧЕН) ===
  TELEGRAM: {
    BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
    CHAT_ID: process.env.TELEGRAM_CHAT_ID || '-4704543688',
    enabled: process.env.TELEGRAM_ENABLED === 'true' && process.env.TELEGRAM_BOT_TOKEN !== ''
  },
  
  // === VAPID КЛЮЧИ ===
  VAPID: {
    PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || 'BP2xfmqDnX7-yoDsZQxgHt8aTd7fSRhLno0-fPwpGoglILifPqzVmEo0OLNYILeU0qVkC5qo_rLhzzcrBh_EIIs',
    PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || 'YRA0u3DtdvUpV-aGr0wBewoy-n3MWdwdGYy8pyffxdI'
  },
  
  // === СЕРВЕР ===
  PORT: process.env.PORT || 10000,
  USE_HTTPS: process.env.USE_HTTPS === 'true' || false,
  
  SSL: {
    KEY: process.env.SSL_KEY || '',
    CERT: process.env.SSL_CERT || '',
    CA: process.env.SSL_CA || ''
  },
  
  // === ЛИМИТЫ ===
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
  
  // === РЕГИСТРАЦИЯ И CAPTCHA ===
  REGISTRATION: process.env.REGISTRATION_ENABLED !== 'false',
  CAPTCHA: process.env.CAPTCHA_ENABLED === 'true' || true,
  CAPTCHA_URL: process.env.CAPTCHA_URL || 'https://hcaptcha.com/siteverify',
  CAPTCHA_KEY: process.env.CAPTCHA_KEY || 'ES_8227cca58dc8405e80c8623dacc584ab',
  
  // === ФАЙЛЫ ===
  CHUNK_SIZE: process.env.CHUNK_SIZE || 10 * 1024,
  
  // === МОНЕТИЗАЦИЯ (EBALLS) ===
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
    }
  },
  
  // === ДЕБАГ ===
  DEBUG: {
    SKIP_DB: process.env.SKIP_DATABASE === 'true' || true,  // ← ВСЕГДА true для теста
    SKIP_REDIS: true,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
  }
};

export default Config;
