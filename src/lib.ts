import * as fs from "fs";

export namespace vfs {
    export function readFileSync(path: string) {
        return fs.readFileSync(path, { encoding: "utf-8" });
    }
    export function writeFileSync(path: string, data: string) {
        return fs.writeFileSync(path, data, { encoding: "utf-8" });
    }
}