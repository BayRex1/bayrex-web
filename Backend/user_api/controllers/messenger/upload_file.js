import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import Config from '../../../system/global/Config.js';
import { fileTypeFromBuffer } from 'file-type';
import { fileURLToPath } from 'url';
import { getSession, updateAccount } from '../../../system/global/AccountManager.js';
import { getRandomBinary, pushMessage } from '../../../system/global/Function.js';
import { getWaitingFile, updateWaitingFile, deleteWaitingFile } from '../../../system/global/FileManager.js';
import { aesEncryptFile } from '../../../system/global/Crypto.js';
import { dbM } from '../../../lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const poolsDir = path.join(__dirname, '../../../storage/messenger/pools');

await fs.mkdir(poolsDir, { recursive: true });

const generatePoolID = async () => {
    const mask = '**********';
    const files = await fs.readdir(poolsDir);
    const existingFilesSet = new Set(files);

    let id;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        id = [...Array(mask.length)].map(() => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
        ).join('');
        attempts++;
    } while (existingFilesSet.has(id) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
        throw new Error('Не удалось сгенерировать уникальный идентификатор пула');
    }

    return id;
};

const getRandomPool = async () => {
    const random = getRandomBinary();
    if (random === 1) {
        const files = await fs.readdir(poolsDir);
        const folders = await Promise.all(files.map(async file => {
            const stat = await fs.stat(path.join(poolsDir, file));
            return stat.isDirectory() ? file : null;
        }));
        const validFolders = folders.filter(Boolean);
        
        if (validFolders.length === 0) {
            return await generatePoolID();
        }

        const randomFolder = validFolders[Math.floor(Math.random() * validFolders.length)];
        return randomFolder;
    }
    return await generatePoolID();
};

const getBinary = (notBinary) => {
    if (!notBinary || typeof notBinary !== 'object') {
        throw new Error('notBinary должен быть объектом');
    }

    const binaryArray = new Uint8Array(Object.values(notBinary));
    return Buffer.from(binaryArray);
};

const createHash = (buffer) => {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
}

const saveFile = async ({ pool, file }) => {
    const chunksMap = [];
    let offset = 0;

    while (offset < file.length) {
        const chunk = file.slice(offset, offset + Config.CHUNK_SIZE);
        const fileName = createHash(chunk);
        const filePath = path.join(poolsDir, pool, fileName);

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, chunk);

        const result = await dbM.query('INSERT INTO `files` (`chat_id`, `pool`, `name`, `size`) VALUES (?, ?, ?, ?)', [
            0,
            pool,
            fileName,
            chunk.length
        ])
        chunksMap.push(result.insertId);
        offset += Config.CHUNK_SIZE;
    }

    return chunksMap;
};

const createPreview = async (file) => {
    try {
        let quality = 50;
        let buffer;
        const metadata = await sharp(file).metadata();
        const { width, height } = metadata;

        if (width > 70) {
            buffer = await sharp(file)
            .resize(70)
            .jpeg({ quality })
            .toBuffer();
        } else {
            buffer = await sharp(file)
            .jpeg({ quality })
            .toBuffer();
        }

        const { mime } = await fileTypeFromBuffer(buffer) || { mime: 'application/octet-stream' };

        return {
            width: width,
            height: height,
            base64: `data:${mime};base64,${buffer.toString('base64')}`,
        }
    } catch (error) {
        console.error('Ошибка при оптимизации изображения:', error);
    }
};


// Остановка загрузки
export const stopUpload = async ({ data }) => {
    await deleteWaitingFile({ temp_mid: data.temp_mid });
}

// Загрузка файла
export const uploadFile = async ({ account, data }) => {

    const session = await getSession(account.ID);
    const waitingFile = await getWaitingFile({ temp_mid: data.temp_mid });

    if (session.messenger_size > Config.LIMITS.MAX_USER_SPACE) {
        return;
    }

    if (session && waitingFile) {
        waitingFile.file.chunks[data.current_chunk] = getBinary(data.binary);
        waitingFile.file.total_chunks = data.total_chunks;

        await updateWaitingFile({
            temp_mid: data.temp_mid,
            newData: {
                file: {
                    ...waitingFile.file,
                    chunks: waitingFile.file.chunks,
                    total_chunks: waitingFile.file.total_chunks
                }
            }
        });

        const buffer = Buffer.concat(waitingFile.file.chunks);

        if (buffer.length > Config.LIMITS.MAX_FILE_SIZE) {
            await deleteWaitingFile({ temp_mid: data.temp_mid });
            return {
                status: 'error',
                temp_mid: Number(waitingFile.temp_mid),
                text: 'Превышен размер файла.'
            }
        }

        if (waitingFile.file.chunks.length === waitingFile.file.total_chunks) {
            const pool = await getRandomPool();
            const type = await fileTypeFromBuffer(buffer);
            const encrypted = aesEncryptFile(buffer);
            const fileMap = await saveFile({
                pool: pool,
                file: encrypted.buffer
            })

            const message = {
                text: waitingFile.text,
                type: 'file',
                file: {
                    name: waitingFile.file.name,
                    type: type.mime,
                    size: buffer.length,
                    file_map: fileMap,
                    encrypted_key: encrypted.key,
                    encrypted_iv: encrypted.iv
                }
            }

            if (type.mime.startsWith('image/')) {
                const preview = await createPreview(buffer);
                message.type = 'image';
                message.preview = {};
                message.preview.width = preview.width;
                message.preview.height = preview.height;
                message.preview.base64 = preview.base64;
            }

            const answer = await pushMessage({
                account: account,
                target: waitingFile.target,
                message: message,
                isMedia: true
            })

            await updateAccount({
                id: account.ID,
                value: 'messenger_size',
                data: Number(session.messenger_size) + buffer.length
            });
            deleteWaitingFile({ temp_mid: data.temp_mid });

            if (answer) {
                for (const file of fileMap) {
                    await dbM.query('UPDATE `files` SET `chat_id` = ? WHERE `id` = ?', [answer.chat_id, file]);
                }

                return {
                    status: 'sended',
                    mid: Number(answer.mid),
                    temp_mid: Number(waitingFile.temp_mid)
                };
            }
        }
    }
};

export default uploadFile;