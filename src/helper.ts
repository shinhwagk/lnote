import * as fse from 'fs-extra';
import * as jsyaml from 'js-yaml';

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

    export function readJsonSync(file: string) {
        return fse.readJsonSync(file, { encoding: 'utf-8' });
    }

    export function mkdirsSync(...paths: string[]) {
        paths.forEach(p => fse.mkdirsSync(p));
    }

    export function readYamlSync(file: string) {
        return jsyaml.safeLoad(readFileSync(file));
    }

    export function writeYamlSync(file: string, obj: any) {
        fse.ensureFileSync(file);
        writeFileSync(file, jsyaml.safeDump(obj));
    }
}

export namespace vpath {
    export const splitStr = '/';
    export function splitPath(path: string): string[] {
        const s = path.startsWith(splitStr) ? path.substr(1) : path;
        const e = s.endsWith(splitStr) ? s.substr(0, s.length - 1) : s;
        return e.split(splitStr).filter(p => !!p);
    }
    export function join(...paths: string[]): string {
        return paths.length >= 2 ? paths.join('/') : paths[0];
    }
}
