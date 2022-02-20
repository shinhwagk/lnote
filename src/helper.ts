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

export namespace tools {
    export function stringArrayEqual(a1: string[], a2: string[]) {
        return JSON.stringify(a1) === JSON.stringify(a2);
    }

    export function hexRandom(len: number): string {
        return randomBytes(len).toString('hex');
    }

    export const intersections = (array1: string[], array2: string[]) => array1.filter(e => array2.indexOf(e) !== -1);
}
