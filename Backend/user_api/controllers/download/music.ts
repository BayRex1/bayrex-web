import { fileTypeFromBuffer } from 'file-type';
import MusicManager from '../../../services/music/MusicManager.js';
import FileManager from '../../../services/system/FileManager.js';
import NodeID3 from 'node-id3';

const music = async ({ account, data }) => {
    const { song_id, offset = 0 } = data.payload || {};

    if (!song_id) return;

    let cachedSong = await FileManager.getChunkFromStorage(`cache/music/${song_id}`, offset, 512 * 1024);
    let song;

    if (cachedSong.buffer) return {
        status: 200,
        buffer: cachedSong.buffer,
        total_size: cachedSong.totalSize,
        is_last_chunk: cachedSong.isLastChunk
    };

    const musicManager = new MusicManager(account.ID);
    const result = await musicManager.loadSong(song_id);
    song = result.song;

    if (!song || !song.file) return {
        status: 404,
        message: 'song_not_found'
    };

    const songFile = JSON.parse(song.file);

    let tempFile;
    try {
        tempFile = await FileManager.getFromStorage(`music/files/${songFile.file}`);
        console.log('Файл найден:', `music/files/${songFile.file}`);
    } catch (error) {
        console.error('Ошибка загрузки файла:', `music/files/${songFile.file}`, error);
        return {
            status: 404,
            message: 'music_file_not_found'
        };
    }

    const { mime } = await fileTypeFromBuffer(tempFile.buffer);

    if (mime === 'audio/mpeg' || mime === 'audio/x-m4a') {
        const metadata: any = {
            title: song.title,
            artist: song.artist
        };

        if (song.album) metadata.album = song.album;
        if (song.genre) metadata.genre = song.genre;
        if (song.composer) metadata.composer = song.composer;

        if (song.cover && song.cover.file) {
            const cover = await FileManager.getFromStorage(`music/covers/${song.cover.file}`);

            if (cover.buffer) {
                const type = await fileTypeFromBuffer(cover.buffer);

                if (type.mime.startsWith('image/')) {
                    metadata.image = {};
                    metadata.image.mime = type.mime;
                    metadata.image.imageBuffer = cover.buffer;
                    metadata.image.type = {};
                    metadata.image.type.id = 3;
                    metadata.image.type.name = 'front cover';
                }
            }
        }

        const fileBuffer = NodeID3.write(metadata, tempFile.buffer);
        await FileManager.saveToStorage(`cache/music/${song.id}`, fileBuffer);
    }

    cachedSong = await FileManager.getChunkFromStorage(`cache/music/${song_id}`, offset, 512 * 1024);

    if (cachedSong.buffer) return {
        status: 200,
        buffer: cachedSong.buffer,
        total_size: cachedSong.totalSize,
        is_last_chunk: cachedSong.isLastChunk
    };
}

export default music;
