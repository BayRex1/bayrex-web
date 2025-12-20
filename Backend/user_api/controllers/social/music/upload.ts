import { fileTypeFromBuffer } from 'file-type';
import AccountManager from '../../../../services/account/AccountManager.js';
import RouterHelper from '../../../../services/system/RouterHelper.js';
import Config from '../../../../system/global/Config.js';
import { parseBuffer } from 'music-metadata';
import { getDate } from '../../../../system/global/Function.js';
import FileManager from '../../../../services/system/FileManager.js';
import ImageEngine from '../../../../services/system/ImageEngine.js';
import Validator from '../../../../services/system/Validator.js';
import { dbE } from '../../../../lib/db.js';

const upload = async ({ account, data }) => {
    const accountManager = new AccountManager(account.ID);
    const currentPermissions = await accountManager.getPermissions();
    
    if (!currentPermissions || !currentPermissions.MusicUpload) {
        const activePunishment = await dbE.query(`
            SELECT reason, punishment_type, end_date 
            FROM accounts_punishments 
            WHERE user_id = ? AND punishment_type IN ('restrict_music', 'ban') AND is_active = 1
            ORDER BY start_date DESC 
            LIMIT 1
        `, [account.ID]);
        
        if (activePunishment && activePunishment.length > 0) {
            const punishment = activePunishment[0];
            const punishmentText = punishment.punishment_type === 'ban' ? 'заблокирован' : 'ограничена загрузка музыки';
            const reason = punishment.reason || 'Причина не указана';
            const endDate = punishment.end_date ? 
                new Date(punishment.end_date).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : '';
            
            const message = `У вас ${punishmentText}. Причина: ${reason}` + 
                           (endDate ? `. До: ${endDate}` : '');
            
            return RouterHelper.error(message);
        } else {
            return RouterHelper.error('У вас ограничена возможность загрузки музыки');
        }
    }
    
    const {
        title,
        artist,
        album,
        track_number,
        genre,
        release_year,
        composer,
        audio_file,
        cover_file
    } = data.payload;

    let cover = null;
    const isGold = await accountManager.getGoldStatus();
    const validator = new Validator();

    if (await checkTime(account.ID)) {
        return RouterHelper.error('Добавлять музыку можно раз в 30 секунд')
    }

    if (!audio_file || !(audio_file instanceof Buffer)) {
        return RouterHelper.error('Аудио-файл отсутствует');
    }

    const fileType = await fileTypeFromBuffer(audio_file);
    if (!fileType) {
        return RouterHelper.error('Не удалось определить формат аудио-файла');
    }
    const { mime } = fileType;

    const allowed = isGold
        ? ['audio/flac', 'audio/x-flac', 'audio/wav', 'audio/mpeg']
        : ['audio/mpeg'];

    const maxSize = isGold ? Config.LIMITS.GOLD.AUDIO_SIZE : Config.LIMITS.DEFAULT.AUDIO_SIZE;

    if (!allowed.includes(mime)) {
        return RouterHelper.error(isGold
            ? 'Ошибка формата аудио файла'
            : 'Ошибка формата аудио файла, вы можете загружать музыку только в формате MP3, но купив подписку Gold, вам будут доступны ещё форматы «flac» и «wav».'
        );
    }
    if (audio_file.length > maxSize) {
        return RouterHelper.error(`Максимальный размер аудио файла ${maxSize / (1024 * 1024)} МБ`);
    }

    validator.validateText({
        title: 'Название',
        maxLength: 250,
        value: title
    })

    validator.validateText({
        title: 'Исполнитель',
        maxLength: 250,
        value: artist
    });

    validator.validateText({
        title: 'Альбом',
        maxLength: 250,
        nullable: true,
        value: album
    });

    validator.validateNumber({
        title: 'Номер трека',
        value: track_number,
        min: 1,
        max: 9999,
        nullable: true
    });

    validator.validateText({
        title: 'Жанр',
        maxLength: 100,
        nullable: true,
        value: genre
    });

    validator.validateText({
        title: 'Год релиза',
        value: release_year,
        maxLength: 100,
        nullable: true
    });

    validator.validateText({
        title: 'Композитор',
        maxLength: 250,
        nullable: true,
        value: composer
    });

    if (cover_file) {
        await validator.validateImage(cover_file, Config.LIMITS.DEFAULT.AUDIO_COVER_SIZE);

        const ie = new ImageEngine();
        cover = await ie.create({
            file: cover_file,
            path: 'music/covers',
            simpleSize: 400
        })
    }

    const metadata = await parseBuffer(audio_file);
    const duration = metadata.format.duration;
    const bitrate = metadata.format.bitrate;
    const container = metadata.format.container;
    const codec = metadata.format.codec;

    if (!(duration && bitrate && container && codec)) {
        return RouterHelper.error('Файл повреждён.');
    }

    if (!(title && artist)) {
        return RouterHelper.error('Нужно ввести обязательные метаданные.');
    }

    const file = await FileManager.saveFile('music/files', audio_file);

    const fileJson = JSON.stringify({
        file: file,
        path: 'music/files',
    })

    const query = `
    INSERT INTO songs 
        (uid, title, artist, cover, file, album, genre, track_number, release_year, composer, lyrics, duration, bitrate, audio_format, date_added)
    VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await dbE.query(
        query,
        [
            account.ID,
            title,
            artist,
            JSON.stringify(cover),
            fileJson,
            album || null,
            genre || null,
            isNaN(Number(track_number)) || track_number === '' ? null : parseInt(track_number),
            isNaN(Number(release_year)) || release_year === '' ? null : parseInt(release_year),
            composer || null,
            null,
            duration,
            bitrate,
            container,
            getDate()
        ]
    );

    await accountManager.maybeReward('song');

    return RouterHelper.success('Песня добавлена');
}

async function checkTime(userId) {
    const rows = await dbE.query(
        `SELECT date_added FROM songs WHERE uid = ? ORDER BY date_added DESC LIMIT 1`,
        [userId]
    );
    if (!rows || !rows.length) return false;
    const last = new Date(rows[0].date_added).getTime();
    return (Date.now() - last) < 30_000;
}

export default upload;
