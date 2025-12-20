import delete_avatar from "./change/avatar/delete.js";
import upload_avatar from "./change/avatar/upload.js";
import upload_cover from "./change/cover/upload.js";
import description from "./change/description.js";
import name from "./change/name.js";
import username from "./change/username.js";
import create from "./create.js";

export default {
    create,
    change: {
        avatar: {
            upload: upload_avatar,
            delete: delete_avatar
        },
        cover: {
            upload: upload_cover,
            delete: delete_avatar
        },
        name,
        username,
        description
    }
}
