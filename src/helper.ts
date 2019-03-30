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

    export function readYamlSync<T>(file: string): T {
        return jsyaml.safeLoad(readFileSync(file));
    }

    export function writeYamlSync(file: string, obj: any) {
        fse.ensureFileSync(file);
        writeFileSync(file, jsyaml.safeDump(obj));
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
    export function arrayEqual(a1: any[], a2: any[]) {
        return JSON.stringify(a1) == JSON.stringify(a2);
    }
}
