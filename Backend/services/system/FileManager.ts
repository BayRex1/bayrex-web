import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { dbM } from '../../lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = path.join(__dirname, '../../storage');
const TEMP_DIR = path.join(STORAGE_DIR, 'temp');

class FileManager {
    static isSafeName(value: any, allowSlash: boolean = false): boolean {
        if (typeof value !== 'string') return false;
        const re = allowSlash ? /^[a-zA-Z0-9._\/-]+$/ : /^[a-zA-Z0-9._-]+$/;
        if (!re.test(value)) return false;
        if (value.includes('..') || value.includes(',')) return false;
        return true;
    }
    static safePath(...parts: string[]): string {
        const finalPath = path.normalize(path.join(STORAGE_DIR, ...parts));
        if (!finalPath.startsWith(STORAGE_DIR)) {
            throw new Error('Попытка выхода за пределы storage');
        }
        return finalPath;
    }

    static async goToTemp(filePath: string) {
        try {
            await fs.mkdir(TEMP_DIR, { recursive: true });
            const safeFileName = path.basename(filePath);
            const tempFilePath = path.join(TEMP_DIR, safeFileName);
            await fs.copyFile(filePath, tempFilePath);
            return tempFilePath;
        } catch (error) {
            console.error('Ошибка в goToTemp:', error);
            throw error;
        }
    }

    static async saveToStorage(target: string, fileBuffer: Buffer) {
        try {
            const safeTargetPath = this.safePath(target);
            await fs.mkdir(path.dirname(safeTargetPath), { recursive: true });
            await fs.writeFile(safeTargetPath, fileBuffer);
        } catch (error) {
            console.error('Ошибка в saveToStorage:', error);
            throw error;
        }
    }

    static async saveFile(subDir: string, fileBuffer: Buffer) {
        try {
            const ext = await this.getFileType(fileBuffer);
            if (ext === 'undefined') throw new Error('Не удалось определить тип файла');

            const fileName = `${this.hashBuffer(fileBuffer)}.${ext}`;
            const targetDir = this.safePath(subDir);
            await fs.mkdir(targetDir, { recursive: true });

            const fullPath = path.join(targetDir, fileName);
            await fs.writeFile(fullPath, fileBuffer);

            return fileName;
        } catch (error) {
            console.error('Ошибка в saveFile:', error);
            throw error;
        }
    }

    static async deleteFromStorage(target: string) {
        try {
            const safeTarget = this.safePath(target);
            await fs.rm(safeTarget, { recursive: true, force: true });
        } catch (error) {
            console.error('Ошибка в deleteFromStorage:', error);
            throw error;
        }
    }

    static async getFromStorage(target: string): Promise<{ buffer: Buffer; ext: string }> {
        const safeTarget = this.safePath(target);
        const fileBuffer = await fs.readFile(safeTarget);
        return {
            buffer: fileBuffer,
            ext: await this.getFileType(fileBuffer)
        };
    }

    static async getFileType(buffer: Buffer): Promise<string> {
        try {
            const fileType = await fileTypeFromBuffer(buffer);
            if (!fileType?.ext) return 'undefined';
            return fileType.ext;
        } catch {
            return 'undefined';
        }
    }

    static async getChunkFromStorage(target: string, offset: number, length: number) {
        const safeFilePath = this.safePath(target);

        try {
            const stat = await fs.stat(safeFilePath);
            const totalSize = stat.size;

            if (offset >= totalSize) {
                return { buffer: null, totalSize, isLastChunk: true };
            }

            const toRead = Math.min(length, totalSize - offset);
            const nodeBuffer = Buffer.alloc(toRead);

            const handle = await fs.open(safeFilePath, 'r');
            const { bytesRead } = await handle.read(nodeBuffer, 0, toRead, offset);
            await handle.close();

            const actualBuffer =
                bytesRead === toRead ? nodeBuffer : nodeBuffer.slice(0, bytesRead);

            return {
                buffer: new Uint8Array(
                    actualBuffer.buffer,
                    actualBuffer.byteOffset,
                    actualBuffer.byteLength
                ),
                totalSize,
                isLastChunk: offset + bytesRead >= totalSize
            };
        } catch (err) {
            return { buffer: null, totalSize: 0, isLastChunk: true, error: err.message };
        }
    }

    static async getFileByID(id: number) {
        const file = await dbM.query('SELECT * FROM `files` WHERE `id` = ?', [id]);
        if (file.length > 0) {
            return await this.getFromStorage(`/messenger/pools/${file[0].pool}/${file[0].name}`);
        }
        return null;
    }

    static hashBuffer(buffer: Buffer, algorithm: string = 'sha256'): string {
        return crypto.createHash(algorithm).update(buffer).digest('hex');
    }
}

export default FileManager;
