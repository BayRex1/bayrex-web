import like from './like.ts';
import load_library from './load_library.ts';
import add from './playlists/add.ts';
import create from './playlists/create.ts';
import deletePlaylist from './playlists/delete.ts';
import load from './playlists/load.ts';
import remove from './playlists/remove.ts';
import upload from './upload.ts';

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
