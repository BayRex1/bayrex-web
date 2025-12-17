import login from './login.js';
import reg from './reg.js';
import delete_session from './sessions/delete.js';
import load from './sessions/load.js';

export default {
    login,
    reg,
    sessions: {
        load,
        delete: delete_session
    }
}