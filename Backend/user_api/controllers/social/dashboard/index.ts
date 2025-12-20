import addGift from './gifts/add.js';
import deleteGift from './gifts/delete.js';
import editGift from './gifts/edit.js';
import generate_code from './gold/generate_code.js';
import load_codes from './gold/load_codes.js';
import load_statistic from './gold/load_statistic.js';
import recount_users from './gold/recount_users.js';
import statistic from './statistic.js';
import change_password from './users/change_password.js';
import load from './users/load.js';

export default {
    statistic,
    users: {
        load,
        change_password
    },
    gold: {
        load_statistic,
        generate_code,
        load_codes,
        recount_users
    },
    gifts: {
        add: addGift,
        edit: editGift,
        delete: deleteGift
    }
}
