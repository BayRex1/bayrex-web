const waitingFiles = {};

export const createWaitingFile = async ({ temp_mid, message }) => {
    if (!temp_mid || !message) return false;
    if (waitingFiles[temp_mid]) return false;

    waitingFiles[temp_mid] = message;

    return true;
}

export const deleteWaitingFile = async ({ temp_mid }) => {
    delete waitingFiles[temp_mid];
}

export const getWaitingFile = async ({ temp_mid }) => {
    return waitingFiles[temp_mid] || null;
}

export const updateWaitingFile = async ({ temp_mid, newData }) => {
    const currentData = await getWaitingFile({ temp_mid });
    const updatedData = currentData ? { ...currentData, ...newData } : newData;

    waitingFiles[temp_mid] = updatedData;
    return updatedData;
}