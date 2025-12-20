import { dbE } from '../../../../../lib/db.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';

const load_codes = async () => {
    const rows = await dbE.query('SELECT * FROM gold_codes ORDER BY id DESC');

    const codes = rows.map(code => ({
        id: code.id,
        key: code.code,
        activated: code.activated === 1
    }));

    return RouterHelper.success({
        codes: codes
    })
}

export default load_codes;
