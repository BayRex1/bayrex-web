import { getMemoryStorage } from '../../../services/account/AccountStorage.js';
import AccountDataHelper from '../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../services/system/RouterHelper.js';

export const getProfile = async ({ account, data }) => {
    try {
        console.log('👤 Запрос на получение профиля:', { 
            requested: data.username || data.uid,
            viewer: account?.Username 
        });

        if (!data.username && !data.uid) {
            return RouterHelper.error('Профиль не найден');
        }

        const memoryStorage = getMemoryStorage();
        let profileType = [0, 'user']; // [type, string_type]
        let profile = null;

        // Поиск профиля по username или uid
        if (data.username) {
            // Ищем в аккаунтах
            for (const [id, acc] of memoryStorage.accounts.entries()) {
                if (acc.Username === data.username) {
                    profile = { ...acc, ID: id };
                    break;
                }
            }
            
            // Если не нашли в аккаунтах, ищем в каналах
            if (!profile) {
                for (const [id, channel] of memoryStorage.channels.entries()) {
                    if (channel.Username === data.username) {
                        profile = { ...channel, ID: id };
                        profileType = [1, 'channel'];
                        break;
                    }
                }
            }
        } else if (data.uid) {
            // Поиск по ID
            const uid = Number(data.uid);
            
            // Сначала в аккаунтах
            if (memoryStorage.accounts.has(uid)) {
                const acc = memoryStorage.accounts.get(uid);
                profile = { ...acc, ID: uid };
            } 
            // Затем в каналах
            else if (memoryStorage.channels.has(uid)) {
                const channel = memoryStorage.channels.get(uid);
                profile = { ...channel, ID: uid };
                profileType = [1, 'channel'];
            }
        }

        if (!profile) {
            console.log(`❌ Профиль не найден: ${data.username || data.uid}`);
            return RouterHelper.error('Профиль не найден');
        }

        // Подсчёт постов для профиля (если не указано)
        if (!profile.Posts || profile.Posts === 0) {
            let postCount = 0;
            for (const post of memoryStorage.posts.values()) {
                if (post.author_id === profile.ID && post.author_type === profileType[0] && post.hidden === 0) {
                    postCount++;
                }
            }
            profile.Posts = postCount;
            
            // Обновляем в хранилище
            if (profileType[0] === 0) {
                memoryStorage.accounts.set(profile.ID, { ...profile });
            } else {
                memoryStorage.channels.set(profile.ID, { ...profile });
            }
            
            console.log(`📊 Подсчитано постов для ${profile.Username}: ${postCount}`);
        }

        // Получение ссылок профиля (заглушка для памяти)
        let links = null;
        if (profile.Links > 0) {
            // В режиме памяти возвращаем пустые ссылки
            links = [];
            console.log(`🔗 Ссылки профиля (заглушка): ${profile.Username}`);
        }

        // Проверяем, наш ли это профиль и подписку
        let myProfile = false;
        let subscribed = false;
        const accountDataHelper = new AccountDataHelper();

        if (account) {
            if (profileType[0] === 0) {
                myProfile = account.ID === profile.ID;
            } else if (profileType[0] === 1) {
                myProfile = account.ID === profile.Owner;
            }
            
            // Проверка подписки (заглушка для памяти)
            subscribed = false; // Пока заглушка
        }

        // Проверка блокировки (заглушка для памяти)
        const isBlocked = false;
        
        // Подсчёт wall (заглушка)
        const wallCount = 0;
        
        // Подсчёт подарков (заглушка)
        const giftsCount = 0;
        
        // Подсчёт подписчиков (если не указано)
        if (!profile.Subscribers) {
            // В режиме памяти показываем 0
            profile.Subscribers = 0;
        }
        
        // Подсчёт подписок (для пользователей)
        if (profileType[0] === 0 && !profile.Subscriptions) {
            profile.Subscriptions = 0;
        }

        // Формируем данные профиля
        const profileData = {
            type: profileType[1],
            id: profile.ID,
            name: profile.Name,
            username: profile.Username,
            cover: profile.Cover || '/mock/default/cover.jpg',
            avatar: profile.Avatar || '/mock/default/avatar.jpg',
            description: profile.Description || '',
            posts: profile.Posts || 0,
            subscribers: profile.Subscribers || 0,
            subscriptions: profile.Subscriptions || 0,
            subscribed,
            wall_count: wallCount,
            gifts_count: giftsCount,
            create_date: profile.CreateDate || new Date().toISOString(),
            blocked: isBlocked,
            my_profile: myProfile,
            links_count: profile.Links || 0,
            links: links,
            online: false // Заглушка для онлайн статуса
        };

        // Дополнительные данные для пользователей
        if (profileType[0] === 0) {
            // Получаем разрешения
            const permissions = memoryStorage.permissions.get(profile.ID) || {
                Posts: true,
                Comments: true,
                NewChats: true,
                MusicUpload: false,
                Admin: false,
                Verified: false,
                Fake: false
            };
            
            // Иконки (заглушка)
            const icons = [];
            
            profileData.icons = icons;
            profileData.permissions = {
                posts: permissions.Posts,
                comments: permissions.Comments,
                new_chats: permissions.NewChats,
                music_upload: permissions.MusicUpload,
                verified: permissions.Verified,
                fake: permissions.Fake,
                admin: permissions.Admin
            };
            
            // Проверяем онлайн статус (упрощённо через сессии)
            let isOnline = false;
            for (const session of memoryStorage.sessions.values()) {
                if (session.uid === profile.ID && session.connection) {
                    isOnline = true;
                    break;
                }
            }
            profileData.online = isOnline;
        }

        console.log(`✅ Профиль загружен: ${profile.Username} (${profileType[1]})`);
        
        return RouterHelper.success({
            data: profileData
        });
        
    } catch (error) {
        console.error('❌ Ошибка при получении профиля:', error);
        return RouterHelper.error('Ошибка при загрузке профиля');
    }
};

// Вспомогательная функция для определения типа профиля
const getProfileTypeData = async (username) => {
    const memoryStorage = getMemoryStorage();
    
    // Ищем в аккаунтах
    for (const [id, account] of memoryStorage.accounts.entries()) {
        if (account.Username === username) {
            return [id, 0]; // [ID, type]
        }
    }
    
    // Ищем в каналах
    for (const [id, channel] of memoryStorage.channels.entries()) {
        if (channel.Username === username) {
            return [id, 1]; // [ID, type]
        }
    }
    
    return undefined;
};

export const blockProfile = async ({ account, data }) => {
    try {
        if (!account) {
            return RouterHelper.error('Требуется авторизация');
        }

        const profileData = await getProfileTypeData(data.username);

        if (!profileData) {
            return RouterHelper.error('Профиль не найден');
        }

        const memoryStorage = getMemoryStorage();
        const [targetId, targetType] = profileData;
        
        // Создаём запись о блокировке
        const blockKey = `${account.ID}_${targetType}_${targetId}`;
        memoryStorage.blocks.set(blockKey, {
            blockerId: account.ID,
            targetId,
            targetType,
            date: new Date().toISOString()
        });

        console.log(`🚫 Пользователь ${account.Username} заблокировал профиль ${data.username}`);
        
        return RouterHelper.success({
            message: 'Профиль заблокирован'
        });
        
    } catch (error) {
        console.error('❌ Ошибка при блокировке профиля:', error);
        return RouterHelper.error('Ошибка при блокировке');
    }
};

export const unblockProfile = async ({ account, data }) => {
    try {
        if (!account) {
            return RouterHelper.error('Требуется авторизация');
        }

        const profileData = await getProfileTypeData(data.username);

        if (!profileData) {
            return RouterHelper.error('Профиль не найден');
        }

        const memoryStorage = getMemoryStorage();
        const [targetId, targetType] = profileData;
        
        // Удаляем запись о блокировке
        const blockKey = `${account.ID}_${targetType}_${targetId}`;
        const deleted = memoryStorage.blocks.delete(blockKey);

        if (deleted) {
            console.log(`🔓 Пользователь ${account.Username} разблокировал профиль ${data.username}`);
        }
        
        return RouterHelper.success({
            message: 'Профиль разблокирован'
        });
        
    } catch (error) {
        console.error('❌ Ошибка при разблокировке профиля:', error);
        return RouterHelper.error('Ошибка при разблокировке');
    }
};
