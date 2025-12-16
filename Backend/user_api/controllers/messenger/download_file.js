import FileManager from '../../../services/system/FileManager.js';



const downloadFile = async ({ data }) => {

    if (!data?.file_id || !data?.mid) return;



    const fileID = data.file_id;

    const buffer = await FileManager.getFileByID(fileID);



    if (!buffer) return;



    return {

        type: 'messenger',

        action: 'download_file',

        file_id: fileID,

        mid: data.mid,

        binary: buffer

    }

}



export default downloadFile;
