import { dbE } from '../../../../../lib/db.js';
import FileManager from '../../../../../services/system/FileManager.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';

const deleteGift = async ({ data }) => {
    const { gift_id } = data.payload || {};

    if (!gift_id) return RouterHelper.error('ID подарка не указан');

    const gift = await dbE.query('SELECT * FROM gifts WHERE id = ?', [gift_id]);

    if (!gift) return RouterHelper.error('Подарок не найден');
    const image = JSON.parse(gift[0].image);

    FileManager.deleteFromStorage(`gifts/${image.file}`);

    await dbE.query('DELETE FROM gifts WHERE id = ?', [gift_id]);

    return RouterHelper.success({
        message: 'Подарок успешно удален'
    });
}

export default deleteGift;
