const notificationConfig = {
    PostLike: (notification, t) => ({
        title: t('notifications.like'),
        text: t('notifications.like_body'),
        body: `${notification.author.name} ${t('notifications.like_body')}`,
        icon: (
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="m462.3 62.6c-54.8-46.7-136.3-38.3-186.6 13.6l-19.7 20.3-19.7-20.3c-50.2-51.9-131.8-60.3-186.6-13.6-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z" />
            </svg>
        ),
        animation: '/static_sys/Lottie/HEART PURPLE.json'
    }),

    PostDislike: (notification, t) => ({
        title: t('notifications.dislike'),
        text: t('notifications.dislike_body'),
        body: `${notification.author.name} ${t('notifications.dislike_body')}`,
        icon: (
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m473.7 73.8-2.4-2.5c-46-47-118-51.7-169.6-14.8l34.3 103.4-96 64 48 128-144-144 96-64-28.6-86.5c-51.7-37.8-124.4-33.4-170.7 14l-2.4 2.4c-48.7 49.8-50.8 129.1-7.3 182.2l212.1 218.6c7.1 7.3 18.6 7.3 25.7 0l212.2-218.7c43.5-53 41.4-132.3-7.3-182.1z" /></svg>
        ),
        animation: '/static_sys/Lottie/8_BROKEN_OUT.json'
    }),

    PostComment: (notification, t) => ({
        title: t('notifications.comment'),
        text: `${t('notifications.comment_body', {
            text: notification.content?.comment?.text?.length > 0 ? `«${notification.content.comment.text}»` : ''
        })}`,
        body: `${notification.author.name} ${t('notifications.comment_body', {
            text: notification.content?.comment?.text?.length > 0 ? `«${notification.content.comment.text}»` : ''
        })}`,
        icon: (
            <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                <path d="m3 1c-1.10457 0-2 .89543-2 2v4c0 1.10457.89543 2 2 2v1.5c0 .1844.10149.3538.26407.4408s.35985.0775.51328-.0248l2.87404-1.916h2.34861c1.1046 0 2-.89543 2-2v-4c0-1.10457-.8954-2-2-2z" />
            </svg>
        ),
        animation: '/static_sys/Lottie/Writing Hand.json'
    }),

    ReplyComment: (notification, t) => ({
        title: t('notifications.reply'),
        text: `${t('notifications.reply_body', {
            text: notification.content?.comment?.text?.length > 0 ? `«${notification.content.comment.text}»` : ''
        })}`,
        body: `${notification.author.name} ${t('notifications.comment_body', {
            text: notification.content?.comment?.text?.length > 0 ? `«${notification.content.comment.text}»` : ''
        })}`,
        icon: (
            <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                <path d="m3 1c-1.10457 0-2 .89543-2 2v4c0 1.10457.89543 2 2 2v1.5c0 .1844.10149.3538.26407.4408s.35985.0775.51328-.0248l2.87404-1.916h2.34861c1.1046 0 2-.89543 2-2v-4c0-1.10457-.8954-2-2-2z" />
            </svg>
        ),
        animation: '/static_sys/Lottie/Writing Hand.json'
    }),

    Message: (notification) => ({
        title: notification.author.name,
        text: notification.content?.message?.text,
        body: notification.content?.message?.text,
        icon: (
            <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                <path d="m3 1c-1.10457 0-2 .89543-2 2v4c0 1.10457.89543 2 2 2v1.5c0 .1844.10149.3538.26407.4408s.35985.0775.51328-.0248l2.87404-1.916h2.34861c1.1046 0 2-.89543 2-2v-4c0-1.10457-.8954-2-2-2z" />
            </svg>
        ),
        animation: '/static_sys/Lottie/Writing Hand.json'
    }),

    ProfileSubscribe: (notification, t) => ({
        title: t('notifications.subscribe'),
        text: t('notifications.subscribe_body'),
        body: `${notification.author.name} ${t('notifications.subscribe_body')}`,
        icon: (
            <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                <path d="m416 208h-144v-144c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144h-144c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32v-144h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" />
            </svg>
        ),
        animation: '/static_sys/Lottie/HEART PURPLE.json'
    }),

    ProfileUnsubscribe: (notification, t) => ({
        title: t('notifications.unsubscribe'),
        text: t('notifications.unsubscribe_body'),
        body: `${notification.author.name} ${t('notifications.unsubscribe_body')}`,
        icon: (
            <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                <path d="m416 208h-384c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" />
            </svg>
        ),
        animation: '/static_sys/Lottie/8_BROKEN_OUT.json'
    }),

    moderation_delete_post: (notification, t) => ({
        title: 'Модерация',
        text: 'Ваш пост был удален за нарушение правил',
        body: 'Ваш пост был удален модератором за нарушение правил сообщества',
        icon: (
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM232 352a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>
            </svg>
        ),
        animation: '/static_sys/Lottie/Error.json'
    }),

    moderation_delete_comment: (notification, t) => ({
        title: 'Модерация', 
        text: 'Ваш комментарий был удален за нарушение правил',
        body: 'Ваш комментарий был удален модератором за нарушение правил сообщества',
        icon: (
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM232 352a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>
            </svg>
        ),
        animation: '/static_sys/Lottie/Error.json'
    }),

    punishment_applied: (notification, t) => {
        const data = notification.content?.data || {};
        
        let timeLeftText = '';
        if (data.end_date) {
            const endTime = new Date(data.end_date);
            const now = new Date();
            const timeLeftMs = endTime.getTime() - now.getTime();
            
            if (timeLeftMs > 0) {
                const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
                
                if (hours > 0) {
                    timeLeftText = ` (осталось: ${hours} ч. ${minutes} мин.)`;
                } else if (minutes > 0) {
                    timeLeftText = ` (осталось: ${minutes} мин.)`;
                } else {
                    timeLeftText = ' (менее минуты)';
                }
            } else {
                timeLeftText = ' (истекло)';
            }
        } else if (data.duration_hours) {
            timeLeftText = ` (срок: ${data.duration_hours} ч.)`;
        }
        
        return {
            title: notification.content?.title || 'Наложено ограничение',
            text: `${notification.content?.message || 'На ваш аккаунт наложено ограничение'}${timeLeftText}`,
            body: notification.content?.message || 'На ваш аккаунт наложено ограничение',
            icon: (
                <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                    <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM232 152C232 138.8 242.8 128 256 128s24 10.75 24 24v128c0 13.25-10.75 24-24 24S232 293.3 232 280V152zM256 400c-17.36 0-31.44-14.08-31.44-31.44c0-17.36 14.07-31.44 31.44-31.44s31.44 14.08 31.44 31.44C287.4 385.9 273.4 400 256 400z"/>
                </svg>
            ),
            animation: '/static_sys/Lottie/Error.json'
        };
    },

    punishment_lifted: (notification, t) => ({
        title: notification.content?.title || 'Ограничение снято',
        text: notification.content?.message || 'Ограничение снято',
        body: notification.content?.message || 'Ограничение автоматически снято',
        icon: (
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"/>
            </svg>
        ),
        animation: '/static_sys/Lottie/Success.json'
    }),

    permissions_updated: (notification, t) => ({
        title: 'Права обновлены',
        body: 'Ваши права доступа были обновлены администратором',
        icon: (
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
            </svg>
        ),
        animation: '/static_sys/Lottie/Success.json'
    }),

    post_deleted: (notification, t) => ({
        title: 'Пост удален',
        body: notification.message || 'Ваш пост был удален модератором',
        icon: (
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm97.9-320l-17.4 17.4L289.9 256l46.6 46.6 17.4 17.4L320 353.9l-17.4-17.4L256 289.9l-46.6 46.6L192 353.9 158.1 320l17.4-17.4L222.1 256l-46.6-46.6L158.1 192 192 158.1l17.4 17.4L256 222.1l46.6-46.6L320 158.1 353.9 192z"/>
            </svg>
        ),
        animation: '/static_sys/Lottie/Error.json'
    }),

    comment_deleted: (notification, t) => ({
        title: 'Комментарий удален',
        body: notification.message || 'Ваш комментарий был удален модератором',
        icon: (
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm97.9-320l-17.4 17.4L289.9 256l46.6 46.6 17.4 17.4L320 353.9l-17.4-17.4L256 289.9l-46.6 46.6L192 353.9 158.1 320l17.4-17.4L222.1 256l-46.6-46.6L158.1 192 192 158.1l17.4 17.4L256 222.1l46.6-46.6L320 158.1 353.9 192z"/>
            </svg>
        ),
        animation: '/static_sys/Lottie/Error.json'
    }),

    permissions_changed: (notification, t) => ({
        title: 'Изменение разрешений',
        body: notification.message || 'Настройки разрешений обновлены',
        icon: (
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
            </svg>
        ),
        animation: '/static_sys/Lottie/Success.json'
    })
};

const handleNotificationContent = (notification, t) => {
    if (notification.action === 'notification' && notification.content?.subtype) {
        const handler = notificationConfig[notification.content.subtype];
        if (handler) return handler(notification, t);
    }
    
    const handler = notificationConfig[notification.action];
    if (handler) return handler(notification, t);

    return {
        title: t('notifications.unknown'),
        body: notification.content?.message || '',
        icon: null
    };
};

export default handleNotificationContent;
