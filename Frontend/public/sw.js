/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

const CACHE_NAME = 'element-cache-v1';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png',
    '/static_sys/Images/DarkLogo.svg',
    '/static_sys/Images/Logo.svg',
    '/static_sys/UI/Style.scss',
    '/static_sys/UI/DarkStyle.css',
    '/static_sys/UI/AmoledStyle.css',
    '/static_sys/UI/LiquidGlassStyle.css',
    '/static_sys/UI/LiquidGlassAmoledStyle.css'
];

const swTranslations = {
    notifications: {
        like: '❤️ Новый лайк',
        like_body: 'ставит лайк вашему посту',
        dislike: '👎 Дизлайк',
        dislike_body: 'ставит дизлайк вашему посту',
        comment: '💬 Новый комментарий',
        comment_body: 'комментирует ваш пост {{text}}',
        reply: '↩️ Ответ на комментарий',
        reply_body: 'отвечает на ваш комментарий {{text}}',
        subscribe: '🔔 Новый подписчик',
        subscribe_body: 'подписывается на вас',
        unsubscribe: '🔕 Отписка',
        unsubscribe_body: 'отписывается от вас'
    }
};

const swNotificationConfig = {
    PostLike: ({ author }) => ({
        title: swTranslations.notifications.like,
        body: `${author.name} ${swTranslations.notifications.like_body}`
    }),

    PostDislike: ({ author }) => ({
        title: swTranslations.notifications.dislike,
        body: `${author.name} ${swTranslations.notifications.dislike_body}`
    }),

    PostComment: ({ author, content }) => {
        const commentText = content?.comment?.text || '';
        const quoted = commentText.length > 30 ? `"${commentText.slice(0, 30)}..."` : commentText.length ? `"${commentText}"` : '';
        const template = swTranslations.notifications.comment_body;
        const body = template.replace('{{text}}', quoted);
        return {
            title: swTranslations.notifications.comment,
            body: `${author.name} ${body}`
        };
    },

    ReplyComment: ({ author, content }) => {
        const commentText = content?.comment?.text || '';
        const quoted = commentText.length > 30 ? `"${commentText.slice(0, 30)}..."` : commentText.length ? `"${commentText}"` : '';
        const template = swTranslations.notifications.reply_body;
        const body = template.replace('{{text}}', quoted);
        return {
            title: swTranslations.notifications.reply,
            body: `${author.name} ${body}`
        };
    },

    ProfileSubscribe: ({ author }) => ({
        title: swTranslations.notifications.subscribe,
        body: `${author.name} ${swTranslations.notifications.subscribe_body}`
    }),

    ProfileUnsubscribe: ({ author }) => ({
        title: swTranslations.notifications.unsubscribe,
        body: `${author.name} ${swTranslations.notifications.unsubscribe_body}`
    }),

    Message: ({ author, content }) => ({
        title: author.name,
        body: content?.message?.text || ''
    })
};

function generateNotificationText({ action, content, author }) {
    const handler = swNotificationConfig[action];
    if (handler) {
        return handler({ author, content });
    }

    const username = author?.name || author?.username || 'Пользователь';
    return {
        title: '🔔 Новое уведомление',
        body: `${username} выполнил действие: ${action}`
    };
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('push', event => {
    if (!event.data) {
        return;
    }

    const raw = event.data.text();
    let data;
    try {
        data = JSON.parse(raw);
    } catch (error) {
        console.error('Ошибка парсинга push данных:', error);
        data = {};
    }

    const { title, body } = generateNotificationText({
        action: data.action,
        content: data.content,
        author: data.author
    });

    const options = {
        body,
        icon: '/logo512.png',
        badge: '/logo192.png',
        data: data.url || '/',
        tag: data.action || 'default',
        renotify: true,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'open',
                title: 'Открыть',
                icon: '/logo192.png'
            },
            {
                action: 'close',
                title: 'Закрыть'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

self.addEventListener('notificationclose', event => {
    console.log('Уведомление закрыто:', event.notification.tag);
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
