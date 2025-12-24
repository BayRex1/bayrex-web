// services/account/FileManager.js
import { memoryStorage, getAccounts, updateAccount } from './AccountStorage.js';

class FileManager {
    constructor() {
        console.log('📁 FileManager инициализирован');
    }

    /**
     * Загрузить аватар пользователя
     * @param {number} userId 
     * @param {Object} fileData - данные файла
     * @returns {Object}
     */
    uploadAvatar(userId, fileData) {
        const accounts = getAccounts();
        const account = accounts.get(userId);
        
        if (!account) {
            throw new Error('Пользователь не найден');
        }

        const imageId = memoryStorage.nextImageId++;
        const avatarUrl = `/mock/avatars/${userId}_${imageId}.jpg`;
        
        // Создаем запись об изображении
        const image = {
            id: imageId,
            userId,
            type: 'avatar',
            url: avatarUrl,
            filename: fileData?.name || `avatar_${imageId}.jpg`,
            mimeType: fileData?.type || 'image/jpeg',
            size: fileData?.size || 10240,
            uploadedAt: new Date().toISOString(),
            isDefault: false,
            data: fileData?.data || null // В реальности тут был бы buffer
        };

        memoryStorage.images.set(imageId, image);
        
        // Обновляем аккаунт
        const oldAvatar = account.Avatar;
        account.Avatar = avatarUrl;
        account.AvatarImageId = imageId;
        account.updatedAt = new Date().toISOString();

        // Если был старый аватар, помечаем его для удаления
        if (oldAvatar && oldAvatar !== avatarUrl) {
            // В реальности тут была бы логика очистки старого файла
            console.log(`🗑️ Старый аватар ${oldAvatar} будет удален`);
        }

        console.log(`✅ Аватар загружен для пользователя ${userId}: ${avatarUrl}`);
        return {
            success: true,
            url: avatarUrl,
            imageId,
            size: image.size
        };
    }

    /**
     * Удалить аватар
     * @param {number} userId 
     * @returns {Object}
     */
    deleteAvatar(userId) {
        const accounts = getAccounts();
        const account = accounts.get(userId);
        
        if (!account) {
            throw new Error('Пользователь не найден');
        }

        const avatarImageId = account.AvatarImageId;
        
        if (avatarImageId) {
            memoryStorage.images.delete(avatarImageId);
        }

        // Сбрасываем на аватар по умолчанию
        account.Avatar = null;
        account.AvatarImageId = null;
        account.updatedAt = new Date().toISOString();

        console.log(`✅ Аватар удален для пользователя ${userId}`);
        return {
            success: true,
            message: 'Аватар удален'
        };
    }

    /**
     * Загрузить обложку профиля
     * @param {number} userId 
     * @param {Object} fileData 
     * @returns {Object}
     */
    uploadCover(userId, fileData) {
        const accounts = getAccounts();
        const account = accounts.get(userId);
        
        if (!account) {
            throw new Error('Пользователь не найден');
        }

        const imageId = memoryStorage.nextImageId++;
        const coverUrl = `/mock/covers/${userId}_${imageId}.jpg`;
        
        // Создаем запись об изображении
        const image = {
            id: imageId,
            userId,
            type: 'cover',
            url: coverUrl,
            filename: fileData?.name || `cover_${imageId}.jpg`,
            mimeType: fileData?.type || 'image/jpeg',
            size: fileData?.size || 30720,
            uploadedAt: new Date().toISOString(),
            isDefault: false,
            data: fileData?.data || null
        };

        memoryStorage.images.set(imageId, image);
        
        // Обновляем аккаунт
        const oldCover = account.Cover;
        account.Cover = coverUrl;
        account.CoverImageId = imageId;
        account.updatedAt = new Date().toISOString();

        if (oldCover && oldCover !== coverUrl) {
            console.log(`🗑️ Старая обложка ${oldCover} будет удалена`);
        }

        console.log(`✅ Обложка загружена для пользователя ${userId}: ${coverUrl}`);
        return {
            success: true,
            url: coverUrl,
            imageId,
            size: image.size
        };
    }

    /**
     * Удалить обложку профиля
     * @param {number} userId 
     * @returns {Object}
     */
    deleteCover(userId) {
        const accounts = getAccounts();
        const account = accounts.get(userId);
        
        if (!account) {
            throw new Error('Пользователь не найден');
        }

        const coverImageId = account.CoverImageId;
        
        if (coverImageId) {
            memoryStorage.images.delete(coverImageId);
        }

        account.Cover = null;
        account.CoverImageId = null;
        account.updatedAt = new Date().toISOString();

        console.log(`✅ Обложка удалена для пользователя ${userId}`);
        return {
            success: true,
            message: 'Обложка удалена'
        };
    }

    /**
     * Загрузить изображение (для постов и т.д.)
     * @param {number} userId 
     * @param {Object} fileData 
     * @param {Object} options 
     * @returns {Object}
     */
    uploadImage(userId, fileData, options = {}) {
        const imageId = memoryStorage.nextImageId++;
        const imageUrl = `/mock/images/${imageId}.${options.ext || 'jpg'}`;
        
        const image = {
            id: imageId,
            userId,
            type: options.type || 'post_image',
            url: imageUrl,
            filename: fileData?.name || `image_${imageId}.${options.ext || 'jpg'}`,
            mimeType: fileData?.type || 'image/jpeg',
            size: fileData?.size || 0,
            uploadedAt: new Date().toISOString(),
            isDefault: false,
            data: fileData?.data || null,
            ...options
        };

        memoryStorage.images.set(imageId, image);
        
        console.log(`✅ Изображение загружено: ${imageUrl}`);
        return {
            success: true,
            url: imageUrl,
            imageId,
            size: image.size,
            width: options.width || 800,
            height: options.height || 600
        };
    }

    /**
     * Получить информацию об изображении
     * @param {number} imageId 
     * @returns {Object|null}
     */
    getImage(imageId) {
        const image = memoryStorage.images.get(imageId);
        if (!image) {
            return {
                id: imageId,
                url: '/mock/default/image_not_found.jpg',
                isDefault: true,
                error: 'Изображение не найдено'
            };
        }
        return image;
    }

    /**
     * Получить информацию о файле
     * @param {number} fileId 
     * @returns {Object|null}
     */
    getFile(fileId) {
        const file = memoryStorage.files.get(fileId);
        if (!file) {
            return {
                id: fileId,
                url: '/mock/default/file_not_found.txt',
                isDefault: true,
                error: 'Файл не найден'
            };
        }
        return file;
    }

    /**
     * Загрузить файл
     * @param {number} userId 
     * @param {Object} fileData 
     * @returns {Object}
     */
    uploadFile(userId, fileData) {
        const fileId = memoryStorage.nextFileId++;
        const fileUrl = `/mock/files/${fileId}_${fileData.name || 'file'}`;
        
        const file = {
            id: fileId,
            userId,
            url: fileUrl,
            filename: fileData.name || `file_${fileId}`,
            mimeType: fileData.type || 'application/octet-stream',
            size: fileData.size || 0,
            uploadedAt: new Date().toISOString(),
            isDefault: false,
            data: fileData.data || null
        };

        memoryStorage.files.set(fileId, file);
        
        console.log(`✅ Файл загружен: ${fileUrl} (${file.size} байт)`);
        return {
            success: true,
            url: fileUrl,
            fileId,
            size: file.size,
            filename: file.filename
        };
    }
}

export default new FileManager();
