import CryptoJS from 'crypto-js';

// Функция для преобразования ArrayBuffer в PEM формат
export const arrayBufferToPem = (buffer: ArrayBuffer, type: string): string => {
    const binary = String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
    const base64 = btoa(binary);
    let pem = `-----BEGIN ${type}-----\n`;
    pem += base64.match(/.{1,64}/g)?.join('\n') || '';
    pem += `\n-----END ${type}-----\n`;
    return pem;
};

// Импорт публичного ключа
export const importPublicKey = (pk: string): ArrayBuffer => {
    const base64String = pk
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');
    const publicKeyBytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
    const publicKeyBuffer = publicKeyBytes.buffer;
    return publicKeyBuffer;
};

// Импорт приватного ключа
export const importPrivateKey = (pk: string): ArrayBuffer => {
    const base64String = pk
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
    const privateKeyBytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
    const privateKeyBuffer = privateKeyBytes.buffer;
    return privateKeyBuffer;
};

// Шифрование RSA
export const rsaEncrypt = async (data: ArrayBuffer, pk: string): Promise<ArrayBuffer> => {
    try {
        const publicKeyBuffer = importPublicKey(pk);
        const publicKeyE = await crypto.subtle.importKey(
            'spki',
            publicKeyBuffer,
            { name: 'RSA-OAEP', hash: { name: 'SHA-256' } },
            true,
            ['encrypt']
        );
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKeyE,
            data
        );
        return encryptedData;
    } catch (error: any) {
        throw new Error('Ошибка шифрования данных: ' + error.message);
    }
};

// Расшифровка RSA
export const rsaDecrypt = async (data: ArrayBuffer, privateKey: ArrayBuffer): Promise<ArrayBuffer> => {
    try {
        const privateKeyE = await crypto.subtle.importKey(
            'pkcs8',
            privateKey,
            { name: 'RSA-OAEP', hash: { name: 'SHA-256' } },
            true,
            ['decrypt']
        );
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            privateKeyE,
            data
        );
        return decryptedData;
    } catch (error: any) {
        throw new Error('Ошибка расшифровки данных: ' + error.message);
    }
};

// AES шифрование

// Создание ключа AES (возвращает строку в формате base64)
export const generateAESKey = (): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...bytes));
};

// Создание ключа AES из слова
export const aesCreateKeyFromWord = (word: string): string => {
    const hash = CryptoJS.SHA256(word);
    const key = hash.toString(CryptoJS.enc.Hex).slice(0, 32);
    return key;
};

// Преобразование строки base64 в ArrayBuffer
const base64ToBytes = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array([...binaryString].map(char => char.charCodeAt(0)));
    return bytes.buffer;
};

// AES шифрование данных
export const aesEncrypt = async (data: ArrayBuffer, key: string): Promise<Uint8Array | null> => {
    const iv = crypto.getRandomValues(new Uint8Array(16));

    try {
        const importedKey = await crypto.subtle.importKey(
            'raw',
            base64ToBytes(key),
            { name: 'AES-CBC' },
            false,
            ['encrypt']
        );
        const encryptedBuffer = await crypto.subtle.encrypt(
            {
                name: 'AES-CBC',
                iv: iv
            },
            importedKey,
            data
        );

        const result = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
        result.set(iv);
        result.set(new Uint8Array(encryptedBuffer), iv.byteLength);

        return result;
    } catch (error) {
        console.error("Ошибка при шифровании:", error);
        return null;
    }
};

// AES расшифровка данных
export const aesDecrypt = async (data: ArrayBuffer, key: string): Promise<ArrayBuffer> => {
    const iv = data.slice(0, 16);
    const encrypted = data.slice(16);

    const importedKey = await crypto.subtle.importKey(
        'raw',
        base64ToBytes(key),
        { name: 'AES-CBC' },
        false,
        ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-CBC',
            iv: iv
        },
        importedKey,
        encrypted
    );
    return decrypted;
};

// AES расшифровка сообщения, возвращает строку
export const aesDecryptUnit8 = async (data: Uint8Array, key: Uint8Array): Promise<string> => {
    const iv = data.slice(0, 16);
    const encrypted = data.slice(16);

    const importedKey = await crypto.subtle.importKey(
        'raw',
        Uint8Array.from(key),
        { name: 'AES-CBC' },
        false,
        ['decrypt']
    );
    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: 'AES-CBC',
            iv: iv
        },
        importedKey,
        encrypted
    );
    const decryptedDataString = new TextDecoder().decode(decryptedBuffer);
    return decryptedDataString;
};

// AES расшифровка файла
export const aesDecryptFile = async (file: ArrayBuffer, keyB64: string, ivB64: string): Promise<Uint8Array> => {
    const key = base64ToArrayBuffer(keyB64);
    const iv = base64ToArrayBuffer(ivB64);

    try {
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: iv
            },
            cryptoKey,
            file
        );

        return new Uint8Array(decrypted);
    } catch (error: any) {
        console.error('Ошибка расшифровки данных:', error);
        throw error;
    }
};

// Разные дополнительные функции

export const blobToUint8Array = async (blob: Blob): Promise<Uint8Array> => {
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const binaryLen = binaryString.length;
    const bytes = new Uint8Array(binaryLen);
    for (let i = 0; i < binaryLen; ++i) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};
