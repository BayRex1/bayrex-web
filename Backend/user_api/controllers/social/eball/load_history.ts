import { dbE } from '../../../../lib/db.js';
import AccountDataHelper from '../../../../services/account/AccountDataHelper.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';

const load_history = async ({ account, data }) => {
    const { start_index = 0 } = data.payload || {};

    const transactions = await dbE.query(
        `SELECT * FROM transactions
         WHERE sender_id = ? OR recipient_id = ?
         ORDER BY date DESC
         LIMIT ?, 25`,
        [account.ID, account.ID, start_index]
    );

    const accountDataHelper = new AccountDataHelper();

    const transactionResults = await Promise.all(transactions.map(async transaction => {
        const [sender, recipient] = await Promise.all([
            accountDataHelper.getAuthorData(transaction.sender_id),
            accountDataHelper.getAuthorData(transaction.recipient_id)
        ]);

        let result: any = {
            id: transaction.id,
            sender,
            recipient,
            amount: transaction.amount,
            fee: transaction.fee,
            type: transaction.transaction_type,
            message: transaction.message,
            date: transaction.date,
            is_incoming: transaction.sender_id !== account.ID
        }

        if (transaction.transaction_type === 'gift_pay') {
            const gift = await dbE.query('SELECT * FROM gifts WHERE id = ?', [transaction.details.gift_id]);
            result.gift = gift[0];
            result.gift_recipient = AccountDataHelper.getAuthorDataFromTypeAndID(transaction.details.recipient.type, transaction.details.recipient.id);
        }

        return result;
    }));

    return RouterHelper.success({
        transactions: transactionResults
    });
};


export default load_history;
