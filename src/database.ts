import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import * as objectPath from "object-path";

import { vfs } from './lib';
// import * as vscode from "vscode";

// import untildify = require('untildify');


export interface VSNDomain {
    childs: string[];
    notes: number[];
}

// enum VSNoteKind {
//     SQL
// }
export interface VSNNote {
    id: number;
    meta: VSNNoteMeta;
    contents: string[];
}

interface VSNNoteMeta {
    category: string;
}

// function createDatabase(dbPath: string) {
//     const cachedb = {}
//     return (dPath: string, f: any) => f(dPath, cachedb);
// }

// // function database

// const common = createDatabase("ggg");

// export const selectDomaintest = (dpath: string) => {
//     function f(dPath: string, cacheDomains: any): VSNDomain {
//         const domain = objectPath.get(cacheDomains, dPath.split("/").filter(n => !!n));
//         const childs: string[] = Object.keys(domain).filter(name => name !== ".notes");
//         return { childs, notes: domain[".notes"] };
//     }
//     return common(dpath, f) as VSNDomain;
// }
export class VSNDatabase {
    private readonly dbPath: string;
    private readonly notesPath: string;
    private readonly domainsFile: string;
    private readonly notesSeqFile: string;
    private cacheDomains: any;
    private readonly noteMatchRegex = /^[0-9]\.[a-z]+$/;

    constructor(dbRootPath?: string) {
        this.dbPath = path.join(dbRootPath || os.homedir(), ".vscode-note");
        this.notesPath = path.join(this.dbPath, "notes");
        this.domainsFile = path.join(this.dbPath, "domains.json");
        this.notesSeqFile = path.join(this.dbPath, "notes.seq");
        this.createDBIfNotExist();
        this.open();
    }

    public open() {
        this.cacheDomains = JSON.parse(fs.readFileSync(this.domainsFile, { encoding: "utf-8" }));
    }

    public close() {
        this.cacheDomains = undefined;
    }

    public selectDomain(dPath: string): VSNDomain {
        const domain = objectPath.get(this.cacheDomains, dPath.split("/").filter(n => !!n));
        const childs: string[] = Object.keys(domain).filter(name => name !== ".notes");
        return { childs, notes: domain[".notes"] };
    }

    private createDBIfNotExist(): void {
        if (fs.existsSync(this.dbPath)) { return; }
        fs.mkdirSync(this.dbPath);
        fs.mkdirSync(this.notesPath);
        fs.writeFileSync(this.domainsFile, "{}", { encoding: 'utf-8' });
    }

    public selectNotes(dpath: string): VSNNote[] {
        return this.selectDomain(dpath).notes.map(id => this.selectNote(id));
    }

    public selectNote(id: number): VSNNote {
        const notePath = path.join(this.notesPath, id.toString());
        const noteMetaPath = path.join(notePath, ".n.json");
        const flist = fs.readdirSync(notePath).filter(d => !d.startsWith("."));

        const contents: string[] = [];
        for (const f of flist) {
            const fpath = path.join(this.notesPath, id.toString(), f);
            const fstat = fs.statSync(fpath);
            if (fstat.isFile && this.noteMatchRegex.test(f)) {
                const content = fs.readFileSync(fpath, { encoding: "utf-8" });
                contents.push(content);
            }
        }
        const meta: VSNNoteMeta = JSON.parse(fs.readFileSync(noteMetaPath, { encoding: "utf-8" }));
        return { id, contents, meta: { category: meta.category } };
    }


    public createNote(dpath: string): void {
        const noteid: number = this.incNoteSeq();
        const notepath = path.join(dpath, ".notes")
        const notes = objectPath.get<number[]>(this.cacheDomains, notepath.split("/").filter(p => !!p), []);
        notes.push(noteid);
        objectPath.set(this.cacheDomains, notepath.split("/").filter(p => !!p), notes);
        this.checkout();
    }

    public selectNoteSeq(): number {
        return Number(vfs.readFileSync(this.notesSeqFile));
    }

    public incNoteSeq(): number {
        const seq = this.selectNoteSeq() + 1;
        vfs.writeFileSync(this.notesSeqFile, seq.toString());
        return seq;
    }

    private checkout() {
        vfs.writeFileSync(this.domainsFile, JSON.stringify(this.cacheDomains));
    }
}