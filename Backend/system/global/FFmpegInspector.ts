import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, extname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface VideoMetadata {
    width: number | null;
    height: number | null;
    duration: number;
    format: string | null;
    videoCodec: string | null;
    audioCodec: string | null;
    videoBitrate: number;
    fileSize: number;
}

export class FFmpegInspector {
    private filePath: string;
    private isTempFile: boolean = false;

    constructor(input: Buffer, originalName = 'video.mp4') {
        const safeExt = (() => {
            const e = extname(originalName).toLowerCase();
            const allowed = new Set(['.mp4', '.mov', '.webm', '.mkv', '.avi']);
            return allowed.has(e) ? e : '.mp4';
        })();

        const tempName = `${randomUUID()}${safeExt}`;
        const tempPath = resolve(tmpdir(), tempName);
        writeFileSync(tempPath, input);
        this.filePath = tempPath;
        this.isTempFile = true;
    }

    async getMetadata(): Promise<VideoMetadata> {
        const args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', this.filePath];

        return new Promise((resolvePromise, reject) => {
            const ffprobe = spawn('ffprobe', args);
            let output = '';
            let error = '';

            ffprobe.stdout.on('data', (data) => output += data);
            ffprobe.stderr.on('data', (data) => error += data);

            ffprobe.on('close', () => {
                if (error) return reject(new Error(`ffprobe error: ${error}`));

                try {
                    const data = JSON.parse(output);
                    const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
                    const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

                    resolvePromise({
                        width: videoStream?.width ?? null,
                        height: videoStream?.height ?? null,
                        duration: parseFloat(data.format?.duration ?? 0),
                        format: data.format?.format_long_name ?? null,
                        videoCodec: videoStream?.codec_name ?? null,
                        audioCodec: audioStream?.codec_name ?? null,
                        videoBitrate: parseInt(videoStream?.bit_rate ?? 0),
                        fileSize: parseInt(data.format?.size ?? 0),
                    });
                } catch (err) {
                    reject(new Error(`Ошибка парсинга JSON из ffprobe: ${(err as Error).message}`));
                }
            });
        });
    }

    async extractFrame(outputPath: string, time: string = '00:00:01.000'): Promise<string> {
        const safeOutput = (() => {
            const name = basename(outputPath || 'frame.jpg');
            return resolve(tmpdir(), name);
        })();
        const args = ['-ss', time, '-i', this.filePath, '-frames:v', '1', '-q:v', '2', safeOutput, '-y'];

        return new Promise((resolvePromise, reject) => {
            const ffmpeg = spawn('ffmpeg', args);

            let error = '';
            ffmpeg.stderr.on('data', (data) => error += data);

            ffmpeg.on('close', (code) => {
                if (code !== 0) return reject(new Error(`ffmpeg error: ${error}`));
                resolvePromise(safeOutput);
            });
        });
    }

    cleanup(): void {
        if (this.isTempFile && existsSync(this.filePath)) {
            unlinkSync(this.filePath);
        }
    }
}
