import { dbE } from '../../../../../lib/db.js';
import RouterHelper from '../../../../../services/system/RouterHelper.js';

const generateStyleKey = (parts = 3, partLength = 5): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const keyParts: string[] = [];

    for (let i = 0; i < parts; i++) {
        let part = '';
        for (let j = 0; j < partLength; j++) {
            const randIndex = Math.floor(Math.random() * chars.length);
            part += chars[randIndex];
        }
        keyParts.push(part);
    }

    return keyParts.join('-');
};

const createUniqueKey = async (): Promise<string> => {
    let key: string;
    let exists: boolean;

    do {
        key = generateStyleKey();
        const rows = await dbE.query('SELECT 1 FROM gold_codes WHERE code = ? LIMIT 1', [key]);
        exists = rows.length > 0;
    } while (exists);

    await dbE.query('INSERT INTO gold_codes (code) VALUES (?)', [key]);

    return key;
};

const generate_code = async () => {
    const key = await createUniqueKey();

    return RouterHelper.success({
        key: key
    });
}

export default generate_code;
