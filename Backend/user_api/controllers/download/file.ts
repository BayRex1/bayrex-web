import FileManager from '../../../services/system/FileManager.js';

const pathWhiteList = [
    'posts/videos',
    'posts/files',
    'comments/files'
];

const file = async ({ data }) => {

    const { path, file, offset = 0 } = data.payload || {};

    if (!path || !file || !pathWhiteList.includes(path) || file.includes('..') || path.includes('..') || file.includes(',') || path.includes(',')) {
        return {
            status: 400
        };
    }

    const chunk = await FileManager.getChunkFromStorage(`${path}/${file}`, offset, 512 * 1024);

    return {
        status: 200,
        buffer: chunk.buffer,
        total_size: chunk.totalSize,
        is_last_chunk: chunk.isLastChunk
    };
};

export default file;
