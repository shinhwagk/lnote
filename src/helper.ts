import * as path from 'path';
import { randomBytes } from 'crypto';

import * as fse from 'fs-extra';

export namespace vfs {
    const encoding = 'utf-8';
    export function readFileSync(path: string): string {
        return fse.readFileSync(path, { encoding });
    }

    export function writeFileSync(path: string, data: string = '') {
        return fse.writeFileSync(path, data, { encoding });
    }

    export function writeJsonSync(file: string, object: any) {
        fse.writeJsonSync(file, object, { encoding });
    }

    export function readJsonSync<T>(file: string): T {
        return fse.readJsonSync(file, { encoding }) as T;
    }
    export function removeSync(file: string) {
        fse.removeSync(file);
    }
    export function ensureFileSync(file: string) {
        if (fse.existsSync(file)) return;
        if (fse.existsSync(path.dirname(file))) {
            vfs.writeFileSync(file, '');
        } else {
        }
    }
}

export namespace vpath {
    const splitStr = '/';
    export function splitPath(path: string): string[] {
        const s = path.startsWith(splitStr) ? path.substr(1) : path;
        const e = s.endsWith(splitStr) ? s.substr(0, s.length - 1) : s;
        return e.split(splitStr).filter((p) => !!p);
    }

    export function join(...paths: string[]): string {
        const j = process.platform === 'win32' ? path.win32.join : path.join;
        return j(...paths);
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
