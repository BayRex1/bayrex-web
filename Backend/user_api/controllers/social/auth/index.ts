import login from './login.ts';
import reg from './reg.ts';
import delete_session from './sessions/delete.ts';
import load from './sessions/load.ts';

export default {
    login,
    reg,
    sessions: {
        load,
        delete: delete_session
    }

}
