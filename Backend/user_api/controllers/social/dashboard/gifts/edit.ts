import { dbE } from '../../../../../lib/db.js';
import FileManager from '../../../../../services/system/FileManager.js';
import ImageEngine from '../../../../../services/system/ImageEngine.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';
import Validator from '../../../../../services/system/Validator.js';

const editGift = async ({ data }) => {
    const { gift_id, name = '', description = '', price = 0, image = null } = data.payload || {};

    if (!gift_id) return RouterHelper.error('ID подарка не указан');

    const gift = await dbE.query('SELECT * FROM gifts WHERE id = ?', [gift_id]);

    if (!gift) return RouterHelper.error('Подарок не найден');

    const validator = new Validator();

    if (name) {
        validator.validateText({
            title: 'Название',
            value: name,
            maxLength: 100,
            nullable: false
        });
    }

    if (description) {
        validator.validateText({
            title: 'Описание',
            value: description,
            maxLength: 1000,
            nullable: false
        });
    }

    if (price) {
        validator.validateNumber({
            title: 'Цена',
            value: price,
            min: 0,
            max: 1000,
            nullable: false
        });
    }

    if (image) {
        const imageEngine = new ImageEngine();
        const oldImage = JSON.parse(gift.image);

        await validator.validateImage(image, 5 * 1024 * 1024);

        FileManager.deleteFromStorage(`gifts/${oldImage.image}`);

        const uploadImage = await imageEngine.create({
            path: 'gifts',
            file: image,
            simpleSize: 500,
            preview: true
        });

        if (!uploadImage) return RouterHelper.error('Не удалось загрузить изображение');

        await dbE.query('UPDATE gifts SET image = ? WHERE id = ?', [JSON.stringify(uploadImage), gift_id]);
    }

    return RouterHelper.success();
}

export default editGift;
