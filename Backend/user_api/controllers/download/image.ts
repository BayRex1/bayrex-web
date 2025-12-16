import FileManager from '../../../services/system/FileManager.js';

const image = async ({ data }) => {

    const pathWhiteList = [
        'messenger/avatars',
        'avatars',
        'covers',
        'comments/images',
        'posts/images',
        'music/covers',
        'gifts'
    ];

    if (!pathWhiteList.includes(data.image.path)) return {
        status: 500
    };

    if (!FileManager.isSafeName(data.image.simple) || (data.image.file && !FileManager.isSafeName(data.image.file))) {
        return { status: 400 };
    }

    const simpleImage = await FileManager.getFromStorage(`simple/${data.image.simple}`);
    let image: any = null;

    if (!simpleImage) return {
        status: 404
    };

    if (data.lossless && FileManager.isSafeName(data.image.file)) {
        image = await FileManager.getFromStorage(`${data.image.path}/${data.image.file}`);
    }

    return {
        status: 200,
        file: image,
        simple: simpleImage
    }
}

export default image;
