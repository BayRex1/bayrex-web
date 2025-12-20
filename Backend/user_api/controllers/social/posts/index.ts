import { like, dislike } from './interaction.js';
import delete_post from './delete.js';
import add from './add.js';

export default {
    add,
    like,
    dislike,
    delete: delete_post
}
