import { dbE } from '../../../../../lib/db.js';
import ImageEngine from '../../../../../services/system/ImageEngine.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';
import Validator from '../../../../../services/system/Validator.js';
import { getDate } from '../../../../../system/global/Function.js';

const addGift = async ({ data }) => {
    const { name, price, quantity = 0, description, image } = data.payload || {};

    if (!name || !price || !image) return RouterHelper.error('Не все поля заполнены');

    if (price < 0) return RouterHelper.error('Цена не может быть отрицательной');

    const validator = new Validator();
    const imageEngine = new ImageEngine();

    validator.validateText({
        title: 'Название',
        value: name,
        maxLength: 100,
        nullable: false
    });

    validator.validateNumber({
        title: 'Цена',
        value: price,
        min: 0,
        max: 1000,
        nullable: false
    });

    validator.validateNumber({
        title: 'Количество',
        value: quantity,
        min: 0,
        max: 200000,
        nullable: false
    });
    
    if (description) {
        validator.validateText({
            title: 'Описание',
            value: description,
            maxLength: 1000,
            nullable: false
        });
    }

    await validator.validateImage(image, 5 * 1024 * 1024);

    const uploadImage = await imageEngine.create({
        path: 'gifts',
        file: image,
        simpleSize: 500,
        preview: true
    });

    if (!uploadImage) return RouterHelper.error('Не удалось загрузить изображение');

    const gift = await dbE.query('INSERT INTO gifts (name, description, price, quantity, image, date) VALUES (?, ?, ?, ?, ?, ?)', [name, description, price, quantity, JSON.stringify(uploadImage), getDate()]);

    return RouterHelper.success({
        gift_id: gift.insertId
    });
}

export default addGift;
