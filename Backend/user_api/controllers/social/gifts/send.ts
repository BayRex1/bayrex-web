import { dbE } from '../../../../lib/db.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import { getDate } from '../../../../system/global/Function.js';

const sendGift = async ({ account, data }) => {
	const { username, gift_id } = data.payload || {};

	if (!username || !gift_id) {
		return RouterHelper.error('Не все данные получены');
	}

	const recipient = await AccountDataHelper.getDataFromUsername(username);
	if (!recipient) {
		return RouterHelper.error('Получатель не найден');
	}

	return await dbE.withTransaction(async (conn) => {
		const [gifts] = await conn.query<any[]>(
			'SELECT * FROM gifts WHERE id = ? FOR UPDATE',
			[gift_id]
		);

		if (gifts.length < 1) {
			return RouterHelper.error('Подарок не найден');
		}

		const gift = gifts[0];

		if (gift.quantity < 1) {
			return RouterHelper.error('Подарок не доступен для покупки');
		}

		const [accounts] = await conn.query<any[]>(
			'SELECT Eballs FROM accounts WHERE ID = ? FOR UPDATE',
			[account.ID]
		);

		if (accounts.length < 1) {
			return RouterHelper.error('Аккаунт не найден');
		}

		const balance = accounts[0].Eballs;

		if (gift.price > balance) {
			return RouterHelper.error(`У вас недостаточно Е-Баллов: нужно ${gift.price}, у вас ${balance}`);
		}

		await conn.query(
			'UPDATE accounts SET Eballs = Eballs - ? WHERE ID = ?',
			[gift.price, account.ID]
		);

		await conn.query(
			'UPDATE gifts SET quantity = quantity - 1 WHERE id = ?',
			[gift_id]
		);

		const details = JSON.stringify({
			recipient: {
				id: recipient.id,
				type: recipient.type
			},
			gift_id
		});

		await conn.query(
			`INSERT INTO transactions 
			 (sender_id, amount, transaction_type, details, date)
			 VALUES (?, ?, 'gift_pay', ?, ?)`,
			[
				account.ID,
				gift.price,
				details,
				getDate()
			]
		);

		await conn.query(
			`INSERT INTO entity_gifts 
			 (gift_id, entity_type, entity_id, from_entity_type, from_entity_id, message, date)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				gift_id,
				recipient.type,
				recipient.id,
				0,
				account.ID,
				null,
				getDate()
			]
		);

		return RouterHelper.success();
	});
};

export default sendGift;
