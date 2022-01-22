import * as objectPath from 'object-path';
import * as path from 'path';
import { metaFileName } from './constants';
import { tools, vfs, vpath } from './helper';
import { existsSync, readdirSync, mkdirSync, removeSync, renameSync } from 'fs-extra';

export interface Domain {
    '.notes': string[];
    [domain: string]: string[] | Domain;
}

export interface NoteMeta {
    version?: string;
    domain: string[];
    category: string;
    links?: string[]; // todo link to other note
    weight?: number; // todo sort at category
    valid?: boolean; // todo when note deleted

}

// export interface Tag {

// }

export interface Shortcuts {
    star: string[];
    last: string[];
}

export class NoteDatabase {
    public readonly dch: DomainCache = new DomainCache();
    private readonly notesPath: string;
    private readonly contentFileNameRegex = /^([0-9])\.txt$/;
    private readonly shortcutsFile: string;

    constructor(notesPath: string) {
        this.notesPath = notesPath;
        this.shortcutsFile = path.join(this.notesPath, 'shortcuts.json');
        this.cacheAllNotes();
    }

    private cacheAllNotes() {
        this.dch.cleanCache();
        this.cacheValidNotes(...readdirSync(this.notesPath));
    }

    public cacheValidNotes(...notes: string[]) {
        for (const nId of notes) {
            if (!this.checkNoteMetaExist(nId)) {
                continue;
            }
            const { domain } = this.readNoteMeta(nId);
            this.dch.cacheNotes(domain, nId);
        }
    }

    public getNoteDocIndexFile = (nId: string, indexName: string) => path.join(this.getNoteDocPath(nId), indexName);

    public getNoteDocPath = (nId: string) => path.join(this.getNotePath(nId), 'doc');

    public getNoteFilesPath = (nId: string) => path.join(this.getNotePath(nId), 'files');

    public getNotePath = (id: string) => path.join(this.notesPath, id);

    public getNoteMetaFile = (id: string) => path.join(this.getNotePath(id), metaFileName);

    public readNoteMeta = (id: string) => vfs.readJsonSync<NoteMeta>(this.getNoteMetaFile(id));

    public checkNoteMetaExist = (id: string) => existsSync(this.getNoteMetaFile(id));

    public selectFilesExist = (nId: string) => existsSync(this.getNoteFilesPath(nId));

    public getNoteContentFile = (nId: string, cNumber: string) => path.join(this.getNotePath(nId), `${cNumber}.txt`);

    public getNoteContentFiles = (nId: string) =>
        readdirSync(this.getNotePath(nId))
            .filter((f: string) => this.contentFileNameRegex.test(f))
            .map((f: string) => this.contentFileNameRegex.exec(f)![1])
            .map((f: string) => this.getNoteContentFile(nId, f));

    public selectDocIndexFile = (nId: string) => {
        const indexFile = readdirSync(this.getNoteDocPath(nId)).filter((f: string) => /^README\.*/.test(f))[0];
        return this.getNoteDocIndexFile(nId, indexFile);
    };

    public writeNoteMeta = (id: string, meta: NoteMeta) => vfs.writeJsonSync(this.getNoteMetaFile(id), meta);

    public selectDocExist(nId: string): boolean {
        return existsSync(this.getNoteDocIndexFile(nId, 'README.md')) || existsSync(this.getNoteDocIndexFile(nId, 'README.html'));
    }

    public selectNoteContents(nId: string): string[] {
        return this.getNoteContentFiles(nId).map((f: string) => vfs.readFileSync(f));
    }

    // A hexadecimal number of 6 bytes is used for a unique note id.
    private genNewSeq(): string {
        const id = tools.hexRandom(3);
        return existsSync(this.getNotePath(id)) ? this.genNewSeq() : id;
    }

    public createNode(dpath: string[], category: string = 'default'): string {
        const newId = this.genNewSeq();
        mkdirSync(this.getNotePath(newId));
        this.writeNoteMeta(newId, { domain: dpath, category });
        this.createNoteCol(newId);
        this.dch.cacheNotes(dpath, newId);
        return newId;
    }

    public createNoteCol(nid: string): string {
        const cnt = (this.selectNoteContents(nid).length + 1).toString();
        vfs.writeFileSync(this.getNoteContentFile(nid, cnt), '');
        return cnt;
    }

    public deleteNoteCol(nid: string, num: number) {
        const colNum = this.selectNoteContents(nid).length;
        removeSync(this.getNoteContentFile(nid, num.toString()));
        if (num !== colNum) {
            for (let i = num + 1; i <= colNum; i++) {
                const org = this.getNoteContentFile(nid, i.toString());
                const tar = this.getNoteContentFile(nid, (i - 1).toString());
                renameSync(org, tar);
            }
        }
    }

    public updateNotesDomain(orgDpath: string[], newDpath: string[], cascade: boolean) {
        this.dch.selectAllNotesUnderDomain(orgDpath).forEach(nId => this.updateNoteDomain(nId, orgDpath, newDpath, cascade));
    }

    public updateNoteDomain(nId: string, orgDpath: string[], newDpath: string[], cascade: boolean) {
        const noteMeta = this.readNoteMeta(nId);
        // for (let i = 0; i < noteMeta.tags.length; i++) {
        const metaPath = noteMeta.domain;
        if (cascade) {
            if (tools.stringArrayEqual(orgDpath, metaPath.slice(0, orgDpath.length))) {
                noteMeta.domain = newDpath.concat(metaPath.slice(orgDpath.length));
            }
        } else {
            if (tools.stringArrayEqual(orgDpath, metaPath)) {
                noteMeta.domain = newDpath;
            }
        }
        // }
        this.writeNoteMeta(nId, noteMeta);
    }

    public createNoteDoc(nId: string) {
        mkdirSync(this.getNoteDocPath(nId));
        vfs.writeFileSync(path.join(this.getNoteDocPath(nId), 'README.md'));
        const meta = this.readNoteMeta(nId);
        // meta.doc = indexName;
        this.writeNoteMeta(nId, meta);
    }

    public createNoteFiles(nId: string) {
        mkdirSync(this.getNoteFilesPath(nId));
    }

    // selectCategoryIndex(nId: string, dpath: string[], category: string): number | undefined {
    //     const nm = this.readNoteMeta(nId);
    //     for (let i = 0; i <= tags.length; i++) {
    //         const tag = tags[i];
    //         if (tools.stringArrayEqual(tag.domain, dpath) && tag.category === category) {
    //             return i;
    //         }
    //     }
    //     return undefined;
    // }

    updateNoteCategory(nId: string, newCategory: string) {
        const nm = this.readNoteMeta(nId);
        nm.category = newCategory;
        this.writeNoteMeta(nId, nm);
    }

    sortNotes(notes: string[]): string[] {
        // const items = [];
        // for (const note of notes) {
        //     const nm = this.readNoteMeta(note);
        //     // items.push({ note, weight: weight || 0 });
        // }
        // return items.sort((_a, b) => b.weight).map(i => i.note);
        return notes
    }

    getShortcutsList(kind: 'last' | 'star'): string[] {
        if (kind === 'last') {
            return vfs.readJsonSync<Shortcuts>(this.shortcutsFile).last
        } else {
            return []
        }
    }

    appendLastDomainToShortcuts(domain: string): void {
        const maxLast = 10;
        let last = this.getShortcutsList('last')
        const dns = this.dch.selectNotesUnderDomain(vpath.splitPath(domain))
        if (dns.length === 0) { return }
        last.push(domain);
        last = Array.from(new Set(last))
        while (last.length > maxLast) { last.shift() }
        const s = vfs.readJsonSync<Shortcuts>(this.shortcutsFile)
        s.last = last
        vfs.writeJsonSync(this.shortcutsFile, s)
    }
}

class DomainCache {
    private cache: Domain = { '.notes': [] };

    public cleanCache() {
        this.cache = { '.notes': [] };
    }

    public createDomain(dpath: string[], name: string): void {
        objectPath.set(this.cache, dpath.concat(name), {}, true);
    }

    public deleteDomain(dpath: string[]) {
        objectPath.del(this.cache, dpath);
    }

    public cacheNotes(dpath: string[], ...notes: string[]): void {
        const domainNotesPath = dpath.concat('.notes');
        const orgNotes = objectPath.get<string[]>(this.cache, domainNotesPath, []);
        objectPath.set(this.cache, domainNotesPath, Array.from(new Set(orgNotes.concat(notes))));
    }

    public removeNotes(dpath: string[], ...nId: string[]): void {
        const domainNotesPath = dpath.concat('.notes');
        const notes = objectPath.get<string[]>(this.cache, domainNotesPath, []);
        objectPath.set(this.cache, domainNotesPath, notes.filter((i: string) => !nId.includes(i)));
    }

    public createNotes(dpath: string[]): void {
        objectPath.set(this.cache, dpath.concat('.notes'), []);
    }

    public selectDomain(dpath: string[] = []): Domain {
        return objectPath.get(this.cache, dpath);
    }

    public selectNotesUnderDomain(dpath: string[]): string[] {
        return this.selectDomain(dpath)['.notes'] || [];
    }

    public selectAllNotesUnderDomain(dpath: string[]): string[] {
        const domain = this.selectDomain(dpath);
        const childDomainNames: string[] = Object.keys(domain).filter(name => name !== '.notes');
        const notes: string[] = this.selectNotesUnderDomain(dpath);
        if (childDomainNames.length === 0) {
            return notes;
        }

        const totalNotes: string[] = [];
        for (const name of childDomainNames) {
            const childDomainNotes: string[] = this.selectAllNotesUnderDomain(dpath.concat(name));
            totalNotes.push(...childDomainNotes);
        }
        return totalNotes.concat(notes);
    }
}
