import * as fse from 'fs-extra';
import { randomBytes } from 'crypto';

export namespace vfs {
    export function readFileSync(path: string): string {
        return fse.readFileSync(path, { encoding: 'utf-8' });
    }

    export function writeJsonSync(file: string, object: any) {
        fse.writeJsonSync(file, object, { encoding: 'utf-8' });
    }

    export function writeFileSync(path: string, data: string) {
        return fse.writeFileSync(path, data, { encoding: 'utf-8' });
    }

    export function readJsonSync<T>(file: string): T {
        return fse.readJsonSync(file, { encoding: 'utf-8' });
    }

    export function mkdirsSync(...paths: string[]) {
        paths.forEach(p => fse.mkdirsSync(p));
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
