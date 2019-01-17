import * as fs from 'fs-extra';

export namespace vfs {
    export function readFileSync(path: string) {
        return fs.readFileSync(path, { encoding: 'utf-8' });
    }

    export function writeJsonSync(file: string, object: any) {
        fs.writeJsonSync(file, object, { encoding: 'utf-8' });
    }

    export function writeFileSync(path: string, data: string) {
        return fs.writeFileSync(path, data, { encoding: 'utf-8' });
    }

    export function readJSONSync(file: string) {
        return fs.readJSONSync(file, { encoding: 'utf-8' });
    }

    export function mkdirsSync(...paths: string[]) {
        paths.forEach(p => fs.ensureDirSync(p));
    }
}
export namespace vpath {
    // export function
}

export function splitPath(path: string): string[] {
    const s = path.startsWith('/') ? path.substr(1) : path;
    const e = s.endsWith('/') ? s.substr(0, s.length - 1) : s;
    return e.split('/').filter(p => !!p);
}
