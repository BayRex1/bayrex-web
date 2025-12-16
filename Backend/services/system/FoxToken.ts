import { createHmac } from 'crypto';

const Constants = {
    SECRET_KEY: Buffer.from(
        "YSSRC$Pv~foGqDTz9-nPu8&>>r)PhSPrjj{lHy_F<xBrp!P?:[@Om?dIGf+#_::!xZ}6xo.)%'h0i-6ll|V?SW2Fh.Vn/r{q<<fh.Vx<q3hvfB53I-&$b?)1&_M;EQ)IkhO)G=DugO8UKUE&-l=0t?$9=U=I8-1",
    ),
    FOX_TIMESTAMP: 1740900000,
    TOKEN_LIFETIME_SECONDS: 365 * 24 * 60 * 60 + 3600,
    MAX_TOKEN_LENGTH: 128,
};

class AppError extends Error {
    public code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = 'AppError';
        this.code = code;
    }
}

const Errors = {
    InvalidHmacLength: () => new AppError('HMAC length is invalid', 'INVALID_HMAC_LENGTH'),
    Base64DecodeError: (err: Error) => new AppError(`Base64 decoding error: ${err.message}`, 'BASE64_DECODE_ERROR'),
    InvalidTokenFormat: () => new AppError('Invalid token format', 'INVALID_TOKEN_FORMAT'),
    UnauthorizedAccess: () => new AppError('Access is unauthorized', 'UNAUTHORIZED_ACCESS'),
};

class FoxToken {
    static encodeBase64(data: Buffer | string): string {
        let buffer: Buffer;
        if (typeof data === 'string') {
            buffer = Buffer.from(data, 'utf8');
        } else {
            buffer = data;
        }
        return buffer.toString('base64url');
    }

    static decodeBase64(data: string): Buffer {
        return Buffer.from(data, 'base64url');
    }

    static createHmac(secret_id: string, data: string): string {
        const key = Buffer.concat([Constants.SECRET_KEY, Buffer.from(secret_id)]);
        const hmac = createHmac('sha256', key);
        hmac.update(data);
        return this.encodeBase64(hmac.digest());
    }

    static splitToken(token: string): [string, string, string] {
        if (token.length > Constants.MAX_TOKEN_LENGTH) {
            throw Errors.InvalidTokenFormat();
        }
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw Errors.InvalidTokenFormat();
        }
        return [parts[0], parts[1], parts[2]];
    }

    static async generateToken(user_id: string, secret_id: string): Promise<string> {
        const encoded_user_id = this.encodeBase64(user_id);
        const timestamp = Math.floor(Date.now() / 1000) - Constants.FOX_TIMESTAMP;

        const timestamp_buffer = Buffer.alloc(8);
        timestamp_buffer.writeBigInt64BE(BigInt(timestamp));

        const encoded_timestamp = this.encodeBase64(timestamp_buffer);
        const data = `${encoded_user_id}.${encoded_timestamp}`;
        const hmac = this.createHmac(secret_id, data);
        return `${data}.${hmac}`;
    }

    static async verifyToken(token: string, secret_id: string): Promise<boolean> {
        const [a, b, c] = this.splitToken(token);
        const hmac = this.createHmac(secret_id, `${a}.${b}`);
        if (c !== hmac) {
            return false;
        }
        return true;
    }
}

export default FoxToken;