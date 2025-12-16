import { fileTypeFromBuffer } from 'file-type';
import AppError from './AppError.js';
import { dbE } from '../../lib/db.js';


class Validator {
    validateText({ title, value, maxLength, nullable = false }: {
        title: string,
        value: any,
        maxLength: number,
        nullable?: boolean
    }): void {
        if (nullable && (value === null || value === undefined || value === '')) return;

        if (!value || value.trim() === '') {
            throw new AppError(`${title} не может быть пустым`);
        }

        if (value.length > maxLength) {
            throw new AppError(`${title} не может быть длиннее ${maxLength} символов`);
        }
    }

    validateNumber({ title, value, min, max, nullable = false }: {
        title: string,
        value: any,
        min: number,
        max: number,
        nullable?: boolean
    }): void {
        if (nullable && (value === null || value === undefined || value === '')) return;

        const number = Number(value);
        if (isNaN(number)) {
            throw new AppError(`${title} должно быть числом`);
        }

        if (number < min || number > max) {
            throw new AppError(`${title} должно быть от ${min} до ${max}`);
        }
    }

    async validateUsername(username: string) {
        const regex = /^[a-zA-Zа-яА-Я0-9._]+$/u;
        if (!regex.test(username)) {
            throw new AppError('Некорректный формат уникального имени');
        }

        const sql = 'SELECT 1 FROM `accounts`, `channels` WHERE accounts.Username = ? OR channels.Username = ? LIMIT 1';
        const rows = await dbE.query(sql, [username, username]);
        if (rows.length > 0) {
            throw new AppError('Уникальное имя занято');
        }
    }

    async validateEmail(email: string, registration: boolean = false) {
        if (!email || email.trim() === '') {
            throw new AppError('Почта не может быть пустой');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new AppError('Некорректный формат почты');
        }

        if (registration) {
            const sql = 'SELECT 1 FROM `accounts` WHERE `Email` = ? LIMIT 1';
            const rows = await dbE.query(sql, [email]);
            if (rows.length > 0) {
                throw new AppError('Почта занята');
            }
        }
    }

    async validateImage(input: unknown, maxSize: number) {
        let buffer: Buffer;

        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            buffer = Buffer.from(input, 'base64');
        } else if (input && typeof input === 'object' && Array.isArray((input as any).data)) {
            buffer = Buffer.from((input as any).data);
        } else {
            throw new AppError('Неподдерживаемый формат изображения');
        }

        const fileType = await fileTypeFromBuffer(buffer);

        if (!fileType || !fileType.ext) {
            throw new AppError('Не удалось определить тип файла');
        }

        const validFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (buffer.byteLength > maxSize) {
            throw new AppError('Файл слишком большой');
        }

        if (!validFormats.includes(fileType.ext)) {
            throw new AppError('Файл не является изображением');
        }

        return {
            buffer,
            type: fileType.ext
        };
    }
}

export default Validator;
