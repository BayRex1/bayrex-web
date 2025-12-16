import { dbE } from '../../lib/db.js';


class PostDataHelper {
    constructor(pid) {
        this.pid = pid;
        this._isValid = undefined;
    }

    async isValidPost() {
        if (this._isValid !== undefined) {
            return this._isValid;
        }

        const [{ count }] = await dbE.query(
            'SELECT COUNT(*) AS count FROM `posts` WHERE `ID` = ?',
            [this.pid]
        );
        this._isValid = count > 0;
        return this._isValid;
    }

    async postLiked(uid) {
        if (!(await this.isValidPost())) return false;

        const [{ count }] = await dbE.query(
            'SELECT COUNT(*) AS count FROM `post_likes` WHERE `PostID` = ? AND `UserID` = ?',
            [this.pid, uid]
        );
        return count > 0;
    }

    async postDisliked(uid) {
        if (!(await this.isValidPost())) return false;

        const [{ count }] = await dbE.query(
            'SELECT COUNT(*) AS count FROM `post_dislikes` WHERE `PostID` = ? AND `UserID` = ?',
            [this.pid, uid]
        );
        return count > 0;
    }
}

export default PostDataHelper;