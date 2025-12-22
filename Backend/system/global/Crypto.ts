import { encode } from '@msgpack/msgpack';
import crypto from 'crypto';

// Импорт публичного ключа (можно удалить, не используется после исправления)
export const importPublicKey = (pk: string): Buffer => {
    const base64String = pk
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');
    const publicKeyBytes = Buffer.from(base64String, 'base64');
    return publicKeyBytes;
}

// Импорт приватного ключа (можно удалить, не используется после исправления)
export const importPrivateKey = (privateKeyPem: string): Buffer => {
    const base64String = privateKeyPem
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
    const privateKeyBytes = Buffer.from(base64String, 'base64');
    return privateKeyBytes;
}

// Шифрование с помощью RSA - ИСПРАВЛЕНО
export const rsaEncrypt = async (data: Uint8Array, pk: string): Promise<Uint8Array> => {
    try {
        // В Node.js используем publicEncrypt вместо crypto.subtle
        const encryptedData = crypto.publicEncrypt(
            {
                key: pk, // PEM ключ напрямую
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            data
        );
        return new Uint8Array(encryptedData);
    } catch (error: any) {
        console.error('❌ RSA encrypt error:', error.message);
        throw new Error('Ошибка шифрования данных: ' + error.message);
    }
}

// Расшифровка с помощью RSA - ИСПРАВЛЕНО
export const rsaDecrypt = async (data: Uint8Array, privateKeyPem: string): Promise<Uint8Array> => {
    try {
        if (!data || data.length === 0) {
            throw new Error('Входные данные пусты или отсутствуют');
        }

        if (!privateKeyPem || typeof privateKeyPem !== 'string') {
            throw new Error('Приватный ключ не предоставлен или некорректен');
        }

        if (data.length < 16) {
            throw new Error('Данные слишком короткие для RSA расшифровки');
        }

        // В Node.js используем privateDecrypt вместо crypto.subtle
        const decryptedData = crypto.privateDecrypt(
            {
                key: privateKeyPem, // PEM ключ напрямую
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            Buffer.from(data)
        );
        return new Uint8Array(decryptedData);
    } catch (error: any) {
        console.error('❌ RSA decrypt error:', {
            dataLength: data?.length || 0,
            hasPrivateKey: !!privateKeyPem,
            errorMessage: error.message,
            errorName: error.name
        });
        throw new Error('Ошибка расшифровки данных: ' + error.message);
    }
}

// Создание ключа AES (в виде строки, закодированной в base64)
export const aesCreateKey = (): string => {
    return crypto.randomBytes(32).toString('base64');
}

// Шифрование с помощью AES-256-CBC
export const aesEncrypt = (data: Uint8Array, key: string): Uint8Array | null => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'base64'), iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

        const result = new Uint8Array(iv.byteLength + encrypted.byteLength);
        result.set(iv);
        result.set(encrypted, iv.byteLength);
        
        return result;
    } catch (error) {
        console.error("❌ AES encrypt error:", error);
        return null;
    }
}

// Шифрование файла с помощью AES-256-CBC
export const aesEncryptFile = (buffer: Buffer): { key: string; iv: string; buffer: Buffer } | null => { 
    try {
        const algorithm = 'aes-256-cbc';
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        return {
            key: key.toString('base64'),
            iv: iv.toString('base64'),
            buffer: encrypted
        };
    } catch (error) {
        console.error('❌ AES file encrypt error:', error);
        return null;
    }
}

// Дешифрование с помощью AES-256-CBC
export const aesDecrypt = (encryptedData: Uint8Array, key: string): Uint8Array | null => {
    try {
        const iv = encryptedData.slice(0, 16);
        const encrypted = encryptedData.slice(16);
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'base64'), iv);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted;
    } catch (error) {
        console.error('❌ AES decrypt error:', error);
        return null;
    }
}

// Шифрование с помощью AES для Uint8Array-ключа
export const aesEncryptUnit8 = (encryptedData: string, key: ArrayLike<number>): Uint8Array | null => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Uint8Array.from(key), iv);
        const encrypted = Buffer.concat([cipher.update(encryptedData, 'utf8'), cipher.final()]);

        const result = new Uint8Array(iv.byteLength + encrypted.byteLength);
        result.set(iv);
        result.set(encrypted, iv.byteLength);
        
        return result;
    } catch (error) {
        console.error("❌ AES Unit8 encrypt error:", error);
        return null;
    }
}

// Дешифрование с помощью AES для Uint8Array-ключа
export const aesDecryptUnit8 = (encryptedData: Uint8Array, key: ArrayLike<number>): string | null => {
    try {
        const iv = encryptedData.slice(0, 16);
        const encrypted = encryptedData.slice(16);
        const decipher = crypto.createDecipheriv('aes-256-cbc', Uint8Array.from(key), iv);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('❌ AES Unit8 decrypt error:', error);
        return null;
    }
}

// Отправка информации с использованием RSA - ИСПРАВЛЕНО
export const sendRSA = async ({ data, key }: { data: any; key: string }): Promise<Uint8Array | undefined> => {
    try {
        console.log('🔐 sendRSA: Шифруем данные RSA');
        const binary = encode(data);
        return await rsaEncrypt(binary, key);
    } catch (error: any) {
        console.error('❌ sendRSA error:', error.message);
        return undefined;
    }
}

// Отправка информации с использованием AES
export const sendAES = async ({ data, key }: { data: any; key: string }): Promise<Uint8Array | null | undefined> => {
    try {
        console.log('🔐 sendAES: Шифруем данные AES');
        const binary = encode(data);
        return aesEncrypt(binary, key);
    } catch (error: any) {
        console.error('❌ sendAES error:', error.message);
        return null;
    }
}
