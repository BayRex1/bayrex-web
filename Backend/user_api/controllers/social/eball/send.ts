import { dbE } from '../../../../lib/db.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import Validator from '../../../../services/system/Validator.js';
import { getDate } from '../../../../system/global/Function.js';

const send = async ({ account, data }) => {
    const { recipient, amount, message } = data.payload || {};

    if (recipient === undefined || amount === undefined) {
        return RouterHelper.error('Некорректные данные');
    }

    const recipientData = await dbE.query('SELECT * FROM accounts WHERE ID = ?', [recipient]);
    const commission = parseFloat((amount * 0.10).toFixed(3));
    const total = parseFloat((amount + commission).toFixed(3));

    if (recipientData.length === 0) {
        return RouterHelper.error('Пользователь не найден');
    }
    if (account.ID === recipient) {
        return RouterHelper.error('Вы не можете отправить сообщение самому себе');
    }
    if (amount < 0.01) {
        return RouterHelper.error('Сумма должна быть не менее 0.01');
    }

    const accountData = await dbE.query('SELECT * FROM accounts WHERE ID = ?', [account.ID]);
    const accountEballs = accountData[0].Eballs;

    if (total > accountEballs) {
        return RouterHelper.error(`У вас недостаточно средств (нужно ${total}, доступно ${accountEballs})`);
    }

    if (message) {
        const validator = new Validator();

        validator.validateText({
            title: 'Сообщение',
            value: message,
            maxLength: 1000
        });
    }

    try {
        await dbE.query(
            'UPDATE accounts SET Eballs = Eballs - ? WHERE ID = ?',
            [total, account.ID]
        );

        await dbE.query(
            'UPDATE accounts SET Eballs = Eballs + ? WHERE ID = ?',
            [amount, recipient]
        );

        const fee = Math.round(amount * 1000 * 0.10) / 1000;

        await dbE.query(
            `INSERT INTO transactions 
             (sender_id, recipient_id, amount, fee, transaction_type, message, date)
             VALUES (?, ?, ?, ?, 'transfer', ?, ?)`,
            [
                account.ID,
                recipient,
                amount,
                fee,
                message ?? null,
                getDate()
            ]
        );
    } catch (err) {
        return RouterHelper.error('Не удалось провести транзакцию, попробуйте позже');
    }

    return RouterHelper.success({
        message: 'Перевод успешно выполнен',
        data: {
            sent_amount: amount,
            commission_amount: commission,
            total_deducted: total
        }
    });
}

export default send;
