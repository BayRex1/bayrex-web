import Config from '../../../system/global/Config.js';
import { createWaitingFile } from '../../../system/global/FileManager.js';
import { pushMessage } from '../../../system/global/Function.js';

const sendMessage = async ({ account, data }) => {
    try {
        if (!data.message || typeof data.message !== 'string' || data.message.trim() === '') return;

    if (data?.files && data?.files?.length > 0) {
        if (data?.files[0].size < Config.LIMITS.MAX_FILE_SIZE) {
            const answer = await createWaitingFile({
                temp_mid: data.temp_mid,
                message: {
                    temp_mid: data?.temp_mid,
                    target: data.target,
                    text: data.message,
                    file: {
                        name: data?.files[0]?.name,
                        size: data?.files[0]?.size,
                        chunks: [],
                        total_chunks: 0
                    },
                }
            })

            if (answer) {
                return {
                    status: 'awaiting_file',
                    temp_mid: data?.temp_mid
                };
            } else {
                return {
                    status: 'error',
                    text: 'Временный идентификатор занят'
                };
            }
        } else {
            return {
                status: 'error',
                temp_mid: data?.temp_mid,
                text: 'Размер файла превышает допустимый лимит в 5 МБ'
            };
        }
    } else {
        const answer = await pushMessage({
            account: account,
            target: data.target,
            message: {
                text: data.message
            },
            isMedia: false
        });

        return {
            status: 'sended',
            mid: Number(answer.mid),
            temp_mid: data?.temp_mid
        };
    }
    } catch (error) {
        console.error('Ошибка в sendMessage:', error);
        return {
            status: 'error',
            text: 'Внутренняя ошибка сервера'
        };
    }
}

export default sendMessage;