import { dbE } from '../../../../../lib/db.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';

const load_statistic = async () => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM gold_subs WHERE status = 1) AS active_subscribers_count,
            (SELECT COUNT(*) FROM gold_subs) AS activations_count,
            (SELECT COUNT(*) FROM gold_codes) AS keys_count,
            (SELECT COUNT(*) FROM gold_codes WHERE activated = 0) AS non_activated_keys_count
    `;

    const [statistics] = await dbE.query(query);
    
    return RouterHelper.success({
        statistic: {
            active_subscribers: statistics.active_subscribers_count || 0,
            activations: statistics.activations_count || 0,
            keys: statistics.keys_count || 0,
            non_activated_keys: statistics.non_activated_keys_count || 0
        }
    });
}

export default load_statistic;
