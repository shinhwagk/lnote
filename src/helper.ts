import * as fs from 'fs';
import { randomBytes } from 'crypto';

export namespace vfs {
    export function readFileSync(path: string): string {
        return fs.readFileSync(path, { encoding: 'utf-8' });
    }

    export function writeFileSync(path: string, data: string = '') {
        return fs.writeFileSync(path, data, { encoding: 'utf-8' });
    }

    export function writeJsonSync(file: string, object: any) {
        writeFileSync(file, JSON.stringify(object));
    }

    export function readJsonSync<T>(file: string): T {
        return JSON.parse(readFileSync(file));
    }
}

export namespace vpath {
    const splitStr = '/';
    export function splitPath(path: string): string[] {
        const s = path.startsWith(splitStr) ? path.substr(1) : path;
        const e = s.endsWith(splitStr) ? s.substr(0, s.length - 1) : s;
        return e.split(splitStr).filter(p => !!p);
    }
}

export namespace tools {
    export function stringArrayEqual(a1: string[], a2: string[]) {
        return JSON.stringify(a1) === JSON.stringify(a2);
    }

    export function hexRandom(len: number): string {
        return randomBytes(len).toString('hex');
    }
}
