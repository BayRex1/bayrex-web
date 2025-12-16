import sharp from 'sharp';
import FileManager from './FileManager.js';
import { fileTypeFromBuffer } from 'file-type';
import heicConvert from 'heic-convert';

class ImageEngine {

    async getDominantColorFromBuffer(buffer) {
        const { data } = await sharp(buffer)
            .resize(1, 1)
            .raw()
            .toBuffer({ resolveWithObject: true });

        const [r, g, b] = data;

        return `rgb(${r}, ${g}, ${b})`;
    }

    async createSimple(buffer: Buffer, simpleSize: number) {
        const webpBuffer = await sharp(buffer)
            .resize({ width: simpleSize, withoutEnlargement: true })
            .webp({ quality: 60 })
            .toBuffer();

        return webpBuffer;
    }

    async createPreview(buffer: Buffer) {
        const webpBuffer = await sharp(buffer)
            .resize({ width: 50, withoutEnlargement: true })
            .webp({ quality: 20 })
            .toBuffer();

        const base64 = webpBuffer.toString('base64');
        const dataUri = `data:image/webp;base64,${base64}`;

        return dataUri;
    }

    async create({ path, file, simpleSize = 300, preview = false }) {
        try {
            const type = await fileTypeFromBuffer(file);
            let res: any = {};
            const fileName = await FileManager.saveFile(path, file);

            let sharpInput = file;

            if (type?.mime === 'image/heic' || type?.mime === 'image/heif') {
                sharpInput = await heicConvert({
                    buffer: file,
                    format: 'PNG'
                })
                console.log('Изображение преобразовано в PNG');
            }

            const simpleImage = await FileManager.saveFile(
                'simple',
                await this.createSimple(sharpInput, simpleSize)
            );

            res = {
                file: fileName,
                path: path,
                aura: await this.getDominantColorFromBuffer(sharpInput),
                simple: simpleImage
            };

            if (preview) {
                res.preview = await this.createPreview(sharpInput);
            }

            return res;
        } catch (err) {
            console.error('Ошибка при создании изображения:', err.message);
            return null;
        }
    }

}

export default ImageEngine;