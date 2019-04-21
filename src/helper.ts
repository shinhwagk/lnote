import * as jsyaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

export namespace vfs {
    export function readFileSync(path: string): string {
        return fs.readFileSync(path, { encoding: 'utf-8' });
    }

    export function writeJsonSync(file: string, object: any) {
        fs.writeFileSync(file, JSON.stringify(object), { encoding: 'utf-8' });
    }

    export function writeFileSync(path: string, data: string = '') {
        return fs.writeFileSync(path, data, { encoding: 'utf-8' });
    }

    export function readJsonSync(file: string) {
        return JSON.parse(fs.readFileSync(file, { encoding: 'utf-8' }));
    }

    export function mkdirsSync(...paths: string[]) {
        paths.forEach(p => fs.mkdirSync(p));
    }

    export function readYamlSync<T>(file: string): T {
        return jsyaml.safeLoad(readFileSync(file));
    }

    export function writeYamlSync(file: string, obj: any) {
        // fse.ensureFileSync(file);
        // fs.mkdirSync()
        writeFileSync(file, jsyaml.safeDump(obj));
    }
    export function removeSync(file: string) {
        fs.unlinkSync(file);
    }
    export function ensureFileSync(file: string) {
        if (fs.existsSync(file)) return;
        if (fs.existsSync(path.dirname(file))) {
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
