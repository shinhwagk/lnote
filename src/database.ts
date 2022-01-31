import * as path from 'path';

import * as objectPath from 'object-path';
import { existsSync, readdirSync, mkdirSync, renameSync } from 'fs-extra';

import { metaFileName } from './constants';
import { tools, vfs, vpath } from './helper';

export interface Domain {
    '.notes': string[]; // .notes as cache for .labels
    '.labels': string[];
    [domain: string]: string[] | Domain;
}

export interface NoteMeta {
    category: string;
    labels: string[];
}

export interface Shortcuts {
    star: string[];
    last: string[];
}

export class VNDatabase {
    readonly noteDB: NoteDatabase;
    readonly domainDB: DomainDatabase;
    constructor(notesPath: string) {
        this.noteDB = new NoteDatabase(notesPath);
        this.domainDB = new DomainDatabase(notesPath);
    }
}

export class NoteDatabase {
    private readonly notesPath: string;
    private notesCache: Map<string, string[]> = new Map(); // cache labels with nId, more notes of one label
    private notesCacheFileName = 'notes.cache.json';

    constructor(notesPath: string) {
        this.notesPath = notesPath;
        this.refresh();
    }

    public getNotesBylabels(labels: string[]): string[] {
        if (labels.length === 1) {
            return this.notesCache.get(labels[0]) || [];
        }
        return labels.slice(1).reduce((nIds, label) => {
            const _nIds = this.notesCache.get(label) || [];
            return nIds.filter((nId) => _nIds.indexOf(nId) !== -1);
        }, this.notesCache.get(labels[0])!);
    }

    private getNotesCacheFile = () => path.join(this.notesPath, this.notesCacheFileName);
    private checkNotesCacheFileExist = () => existsSync(this.getNotesCacheFile());
    private checkNoteMetaFileExist = (nId: string) => existsSync(this.getNoteMetaFile(nId));

    refresh() {
        console.log('start notes cache.');
        if (this.checkNotesCacheFileExist()) {
            this.notesCache = new Map(Object.entries(vfs.readJsonSync(this.getNotesCacheFile())));
            return;
        }

        console.log('notes cache not exist.');
        console.log('notes cache start.');
        for (const nId of readdirSync(this.notesPath)) {
            if (this.checkNoteMetaFileExist(nId)) {
                const nm = this.getNoteMeta(nId);
                this.addNIdsToNoteCacheByLabel(nId, nm.labels, false);
            }
        }
        this.persistence();
        console.log('notes cache success.', this.notesCache.size);
    }

    public removeNIdsFromNoteCacheByLabel(nId: string, labels: string[], persistence: boolean = true): void {
        for (const label of labels) {
            if (this.notesCache.has(label)) {
                const idx = this.notesCache.get(label)?.indexOf(nId);
                if (idx && idx >= -1) {
                    this.notesCache.get(label)?.splice(idx, 1);
                }
            }
        }
        if (persistence) {
            this.persistence();
        }
    }

    public addNIdsToNoteCacheByLabel(nId: string, labels: string[], persistence: boolean = true): void {
        for (const label of labels) {
            if (this.notesCache.has(label)) {
                this.notesCache.get(label)?.push(nId);
            } else {
                this.notesCache.set(label, [nId]);
            }
        }
        if (persistence) {
            this.persistence();
        }
    }

    public getNoteLabels(nId: string): string[] {
        return this.getNoteMeta(nId).labels;
    }

    public updateNotelabels(nId: string, labels: string[]) {
        const nm = this.getNoteMeta(nId);
        nm.labels = labels;
        this.saveNoteMeta(nId, nm);
    }

    public saveNoteMeta = (nId: string, meta: NoteMeta) => vfs.writeJsonSync(this.getNoteMetaFile(nId), meta);

    public persistence = () => vfs.writeJsonSync(this.getNotesCacheFile(), Object.fromEntries(this.notesCache));

    public getNoteDir = (nId: string) => path.join(this.notesPath, nId);

    public getNoteMetaFile = (nId: string) => path.join(this.getNoteDir(nId), metaFileName);

    public getNoteMeta = (nId: string) => vfs.readJsonSync<NoteMeta>(this.getNoteMetaFile(nId));

    // public appendNIdToNotesCache(nId: string, labels: string[], persistence: boolean = true) {
    //     for (const label of labels) {
    //         if (this.notesCache.has(label)) {
    //             this.notesCache.get(label)?.push(nId);
    //         } else {
    //             this.notesCache.set(label, [nId]);
    //         }
    //     }
    //     if (persistence) {
    //         this.persistence();
    //     }
    // }
}

export class DomainDatabase {
    public readonly dch: DomainNotesCache = new DomainNotesCache();
    private readonly notesPath: string;
    private readonly contentFileNameRegex = /^([0-9])\.txt$/;
    private readonly shortcutsFile: string;
    private readonly domainCache: Domain;
    public readonly noteDB: NoteDatabase;

    constructor(notesPath: string) {
        this.notesPath = notesPath;
        this.shortcutsFile = path.join(this.notesPath, 'shortcuts.json');
        this.domainCache = this.getDomain();
        this.noteDB = new NoteDatabase(notesPath);
        // this.cacheAllNotes();
    }

    public refresh(dpath: string[] = []): void {
        this.refreshDomain(dpath);
        this.persistence();
    }

    public refreshDomain(dpath: string[] = []): void {
        const domain = objectPath.get(this.domainCache, dpath);
        const domainLabels = domain['.labels'];
        // console.log(`labels ${domainLabels} ${domainLabels.length}`)
        if (domainLabels.length >= 1) {
            const notes = this.noteDB.getNotesBylabels(domainLabels);
            // console.log(`notes ${JSON.stringify(notes)}`)
            objectPath.set(this.domainCache, dpath.concat('.notes'), notes);
        }

        for (const keys of Object.keys(domain).filter((n) => !['.labels', '.notes'].includes(n))) {
            // console.log(keys)
            this.refreshDomain(dpath.concat(keys));
        }
    }

    public updateLabels(dpath: string[], labels: string[]) {
        objectPath.set(this.domainCache, dpath.concat('.labels'), labels);
    }

    public persistence(): void {
        vfs.writeJsonSync(this.getDomainFile(), this.domainCache);
    }

    private checkDomainFileExist(): boolean {
        return existsSync(this.getDomainFile());
    }

    private createDomainFile(): void {
        vfs.writeJsonSync(this.getDomainFile(), { '.notes': [], '.labels': [] });
    }

    private getDomain(): Domain {
        if (!this.checkDomainFileExist()) {
            this.createDomainFile();
        }
        return vfs.readJsonSync(this.getDomainFile());
    }
    // private getDomainByDpath(dpath: string[]): Domain {
    //     return objectPath.get(this.domainCache, dpath);
    // }

    // private _cacheAllNotes(): void {
    //     this.dch.cleanCache();
    //     this.cacheValidNotes(...readdirSync(this.notesPath));
    // }

    public cacheValidNotes(...notes: string[]) {
        for (const nId of notes) {
            if (!this.checkNoteMetaExist(nId)) {
                continue;
            }
            // const { domain } = this.readNoteMeta(nId);
            // this.dch.cacheNotes(domain, nId);
        }
    }

    public getDomainLabels(dpath: string[]): string[] {
        return this.selectDomain(dpath)['.labels'];
    }

    public getNoteDocIndexFile = (nId: string, indexName: string) => path.join(this.getNoteDocPath(nId), indexName);

    public getNoteDocPath = (nId: string) => path.join(this.getNotePath(nId), 'doc');

    public getNoteFilesPath = (nId: string) => path.join(this.getNotePath(nId), 'files');

    public getDomainFile = () => vpath.join(this.notesPath, 'domain.json');

    public getNotePath = (id: string) => path.join(this.notesPath, id);

    public getNoteMetaFile = (id: string) => path.join(this.getNotePath(id), metaFileName);

    public readNoteMeta = (nId: string) => vfs.readJsonSync<NoteMeta>(this.getNoteMetaFile(nId));

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
        const nId = this.genNewSeq();
        mkdirSync(this.getNotePath(nId));
        this.writeNoteMeta(nId, { labels: dpath.concat([]), category }); // todo, domain + label

        this.createNoteCol(nId);
        this.cacheNote(dpath, nId);
        this.noteDB.addNIdsToNoteCacheByLabel(nId, dpath.concat([]));
        return nId;
    }

    public createNoteCol(nid: string): string {
        const cnt = (this.selectNoteContents(nid).length + 1).toString();
        vfs.writeFileSync(this.getNoteContentFile(nid, cnt), '');
        return cnt;
    }

    public deleteNoteCol(nId: string, cIdx: number) {
        const colNum = this.selectNoteContents(nId).length;
        // removeSync(this.getNoteContentFile(nId, num.toString()));
        this.archiveNoteCol(nId, cIdx);
        if (cIdx !== colNum) {
            for (let i = cIdx + 1; i <= colNum; i++) {
                const org = this.getNoteContentFile(nId, i.toString());
                const tar = this.getNoteContentFile(nId, (i - 1).toString());
                renameSync(org, tar);
            }
        }
    }

    archiveNoteCol(nId: string, cIdx: number) {
        const ts = new Date().getTime();
        const archiveFile = path.join(this.getNotePath(nId), `${cIdx}.${ts}.col`);
        renameSync(this.getNoteContentFile(nId, cIdx.toString()), archiveFile);
    }

    public updateNotesDomain(orgDpath: string[], newDpath: string[], cascade: boolean) {
        this.dch.selectAllNotesUnderDomain(orgDpath).forEach((nId) => this.updateNoteDomain(nId, orgDpath, newDpath, cascade));
    }

    public updateNoteDomain(_nId: string, _orgDpath: string[], _newDpath: string[], _cascade: boolean) {
        // todo remove labels
        // add new domain labels to notes
        // const noteMeta = this.readNoteMeta(nId);
        // // for (let i = 0; i < noteMeta.tags.length; i++) {
        // const metaPath = noteMeta.domain;
        // if (cascade) {
        //     if (tools.stringArrayEqual(orgDpath, metaPath.slice(0, orgDpath.length))) {
        //         noteMeta.domain = newDpath.concat(metaPath.slice(orgDpath.length));
        //     }
        // } else {
        //     if (tools.stringArrayEqual(orgDpath, metaPath)) {
        //         noteMeta.domain = newDpath;
        //     }
        // }
        // // }
        // this.writeNoteMeta(nId, noteMeta);
    }

    public createNoteDoc(nId: string) {
        mkdirSync(this.getNoteDocPath(nId));
        vfs.writeFileSync(path.join(this.getNoteDocPath(nId), 'README.md'));
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
        return notes;
    }

    getShortcutsList(kind: 'last' | 'star'): string[] {
        if (kind === 'last') {
            return vfs.readJsonSync<Shortcuts>(this.shortcutsFile).last;
        } else {
            return [];
        }
    }

    appendLastDomainToShortcuts(domain: string): void {
        const maxLast = 10;
        let last = this.getShortcutsList('last');
        const dns = this.dch.selectNotesUnderDomain(vpath.splitPath(domain));
        if (dns.length === 0) {
            return;
        }
        last.push(domain);
        last = Array.from(new Set(last));
        while (last.length > maxLast) {
            last.shift();
        }
        const s = vfs.readJsonSync<Shortcuts>(this.shortcutsFile);
        s.last = last;
        vfs.writeJsonSync(this.shortcutsFile, s);
    }

    public selectDomainNotes(dpath: string[] = []): string[] {
        return this.selectDomain(dpath)['.notes'];
    }

    public selectDomain(dpath: string[] = []): Domain {
        return objectPath.get(this.domainCache, dpath);
    }

    public selectDomainWithoutMeta(dpath: string[] = []): Domain {
        return objectPath.get(this.domainCache, dpath);
    }

    public selectNotesUnderDomain(dpath: string[]): string[] {
        return this.selectDomain(dpath)['.notes'];
    }

    public selectAllNotesUnderDomain(dpath: string[]): string[] {
        const domain = this.selectDomain(dpath);
        const childDomainNames: string[] = Object.keys(domain).filter((name) => !['.notes', '.labels'].includes(name));
        const notes: string[] = domain['.notes'];
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

    public cacheNote(dpath: string[], nId: string): void {
        objectPath.insert(this.domainCache, dpath.concat('.notes'), nId);
    }
}

class DomainNotesCache {
    private cache: Domain = { '.notes': [], '.labels': [] };

    public cleanCache() {
        this.cache = { '.notes': [], '.labels': [] };
    }

    public createDomain(dpath: string[], name: string): void {
        objectPath.set(this.cache, dpath.concat(name), {}, true);
    }

    public deleteDomain(dpath: string[]) {
        objectPath.del(this.cache, dpath);
    }

    public cacheNote(dpath: string[], nId: string): void {
        objectPath.insert(this.cache, dpath.concat('.notes'), nId);
    }

    public removeNotes(dpath: string[], ...nId: string[]): void {
        const domainNotesPath = dpath.concat('.notes');
        const notes = objectPath.get<string[]>(this.cache, domainNotesPath, []);
        objectPath.set(
            this.cache,
            domainNotesPath,
            notes.filter((i: string) => !nId.includes(i))
        );
    }

    public createNotes(dpath: string[]): void {
        objectPath.set(this.cache, dpath.concat('.notes'), []);
    }

    public selectDomain(dpath: string[] = []): Domain {
        return objectPath.get(this.cache, dpath);
    }

    public selectDomainWithoutMeta(dpath: string[] = []): Domain {
        return objectPath.get(this.cache, dpath);
    }

    // de
    public selectNotesUnderDomain(dpath: string[]): string[] {
        return this.selectDomain(dpath)['.notes'];
    }

    public selectAllNotesUnderDomain(dpath: string[]): string[] {
        const domain = this.selectDomain(dpath);
        const childDomainNames: string[] = Object.keys(domain).filter((name) => !['.notes', '.labels'].includes(name));
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
