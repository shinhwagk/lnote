import * as os from 'os';
import * as path from 'path';

import { existsSync, readdirSync, statSync, mkdirsSync } from 'fs-extra';
import * as objectPath from 'object-path';

import { splitPath, vfs } from './helper';

export interface VSNDomain {
    domains: string[];
    notes: number[];
}

export interface VSNNote {
    id: number;
    meta: VSNNoteMeta;
    contents: string[];
}

interface VSNNoteMeta {
    category: string;
}

export class VSNDatabase {
    private readonly dbPath: string;
    private readonly notesPath: string;
    private readonly domainsFile: string;
    private readonly seqFile: string;
    private cacheDomains: any;
    private readonly noteNameRegex = /^[0-9]\.[a-z]+$/;

    constructor(dbRootPath?: string) {
        this.dbPath = path.join(dbRootPath || os.homedir(), '.vscode-note');
        this.notesPath = path.join(this.dbPath, 'notes');
        this.domainsFile = path.join(this.dbPath, 'domains.json');
        this.seqFile = path.join(this.dbPath, 'seq');
        this.createDBIfNotExist();
        this.cacheDB();
    }

    public cacheDB() {
        this.cacheDomains = vfs.readJSONSync(this.domainsFile);
    }

    public selectDomain(dPath: string): VSNDomain {
        const domain = objectPath.get(this.cacheDomains, splitPath(dPath));
        const domains: string[] = Object.keys(domain).filter(name => name !== '.notes');
        return { domains, notes: domain['.notes'] };
    }

    public selectNotes(dpath: string): VSNNote[] {
        return this.selectDomain(dpath).notes.map(id => this.selectNote(id));
    }

    public selectNoteFsPath(id: number): string {
        return path.join(this.notesPath, id.toString());
    }

    public selectNote(id: number): VSNNote {
        const notePath = path.join(this.notesPath, id.toString());
        const noteMetaPath = path.join(notePath, '.n.json');

        const contents = readdirSync(notePath)
            .filter(f => this.noteNameRegex.test(f))
            .map(n => path.join(notePath, n))
            .filter(f => statSync(f).isFile)
            .map(f => vfs.readFileSync(f));

        const meta: VSNNoteMeta = vfs.readJSONSync(noteMetaPath);
        return { id, contents, meta: { category: meta.category } };
    }

    public _selectDomain(dpath: string): any {
        return objectPath.get(this.cacheDomains, splitPath(dpath));
    }

    public createDomain(dpath: string, name: string): void {
        const oPath = splitPath(path.join(dpath, name));
        objectPath.set(this.cacheDomains, oPath, { '.notes': [] });
        this.checkout();
    }

    public deleteDomain(dpath: string): void {
        const oPath = splitPath(dpath);
        objectPath.del(this.cacheDomains, oPath);
        this.checkout();
    }

    public renameDomain(dpath: any, newName: string): void {
        const opath = splitPath(dpath);
        const domain = this._selectDomain(dpath);
        opath[opath.length - 1] = newName;
        objectPath.set(this.cacheDomains, opath, domain);
        this.deleteDomain(dpath);
        this.checkout();
    }

    public createNote(dpath: string): number {
        const noteid: number = this.incSeq();
        const oPath = splitPath(path.join(dpath, '.notes'));
        const notes = objectPath.get<number[]>(this.cacheDomains, oPath, []);
        notes.push(noteid);
        objectPath.set(this.cacheDomains, oPath, notes);
        vfs.mkdirsSync(path.join(this.notesPath, noteid.toString()));
        vfs.writeFileSync(path.join(this.notesPath, noteid.toString(), '1.txt'), '');
        vfs.writeFileSync(path.join(this.notesPath, noteid.toString(), '.n.json'), '{"category":"default"}');
        this.checkout();
        return noteid;
    }

    public async createNodeCol(nid: number): Promise<void> {
        const notePath = path.join(this.dbPath, 'notes', nid.toString());
        const cnt = readdirSync(notePath).length;
        vfs.writeFileSync(path.join(notePath, `${cnt}.txt`), '');
    }
    // public async deleteNodeCol(nid: number): Promise<void> {
    //     const notePath = path.join(this.dbPath, 'notes', nid.toString());
    //     const cnt = readdirSync(notePath).length;
    //     vfs.writeFileSync(path.join(notePath, `${cnt}.txt`), '');
    // }

    public selectSeq(): number {
        return Number(vfs.readFileSync(this.seqFile));
    }

    public incSeq(): number {
        const seq = this.selectSeq() + 1;
        vfs.writeFileSync(this.seqFile, seq.toString());
        return seq;
    }

    private createDBIfNotExist(): void {
        if (!existsSync(this.dbPath)) {
            vfs.mkdirsSync(this.dbPath, this.notesPath);
            this.createExampleData();
        }
    }

    private checkout() {
        vfs.writeJsonSync(this.domainsFile, this.cacheDomains);
    }

    private createExampleData() {
        const data: { [domain: string]: any } = {
            powershell: {
                install: {},
                '.notes': [1]
            }
        };
        vfs.writeJsonSync(this.domainsFile, data);
        const notePath = path.join(this.notesPath, '1');
        vfs.mkdirsSync(notePath);
        vfs.writeFileSync(path.join(notePath, '1.txt'), 'windows');
        vfs.writeFileSync(path.join(notePath, '2.txt'), 'chose install powershell');
        vfs.writeFileSync(path.join(notePath, '.n.json'), '{"category":"install"}');
        mkdirsSync(path.join(notePath, 'doc'));
        mkdirsSync(path.join(notePath, 'doc'));
    }
}
