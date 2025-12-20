import { dbE } from '../../../../lib/db.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const loadGifts = async ({ data }) => {
    const { username = '' } = data.payload || {};

    const gifts = [];

    if (username) {
        const author = await AccountDataHelper.getDataFromUsername(username);

        if (!author) {
            return RouterHelper.error('Профиль не найден');
        }

        const entityGiftRows = await dbE.query(
            'SELECT gift_id, from_entity_type, from_entity_id FROM entity_gifts WHERE entity_type = ? AND entity_id = ?',
            [author.type, author.id]
        );

        if (!entityGiftRows.length) {
            return RouterHelper.success({ gifts: [] });
        }

        for (const giftRow of entityGiftRows) {
            const [gift] = await dbE.query(
                `SELECT * FROM gifts WHERE id = ?`,
                giftRow.gift_id
            );

            const sender = await AccountDataHelper.getAuthorDataFromTypeAndID(giftRow.from_entity_type, giftRow.from_entity_id);

            gifts.push({
                id: gift.id,
                name: gift.name,
                description: gift.description,
                price: gift.price,
                image: gift.image,
                quantity: gift.quantity,
                sender,
                date: gift.date
            });
        }

        return RouterHelper.success({ gifts });
    }

    const giftsRows = await dbE.query('SELECT * FROM gifts');

    for (const gift of giftsRows) {
        gifts.push({
            id: gift.id,
            name: gift.name,
            description: gift.description,
            price: gift.price,
            image: gift.image,
            quantity: gift.quantity,
            date: gift.date
        });
    }

    return RouterHelper.success({ gifts });
};

export default loadGifts;
