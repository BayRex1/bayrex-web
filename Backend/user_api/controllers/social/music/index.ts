import like from './like.js';
import load_library from './load_library.js';
import add from './playlists/add.js';
import create from './playlists/create.js';
import deletePlaylist from './playlists/delete.js';
import load from './playlists/load.js';
import remove from './playlists/remove.js';
import upload from './upload.js';

export default {
    upload,
    load_library,
    like,
    playlists: {
        load: load,
        create: create,
        add: add,
        remove: remove,
        delete: deletePlaylist
    }
}
