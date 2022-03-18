import * as path from 'path';

import * as objectPath from 'object-path';
import { existsSync, readdirSync, mkdirSync, renameSync, removeSync, statSync, mkdirpSync } from 'fs-extra';

import { metaFileName } from './constants';
import { tools, vfs } from './helper';
// import { Tools } from './explorer/domainExplorer';

export interface Domain {
    '.notes': string[]; // .notes as cache for .labels
    '.labels': string[];
    [domain: string]: string[] | Domain;
}

export interface NoteMeta {
    category: string;
    labels: string[];
    create?: Date;
    modify?: Date;
}

// export interface Shortcuts {
//     star: string[];
//     last: string[];
// }

export class VNDatabase {
    readonly noteDB: NoteDatabase;
    readonly domainDB: DomainDatabase;
    constructor(notesPath: string) {
        this.noteDB = new NoteDatabase(notesPath);
        this.domainDB = new DomainDatabase(notesPath);
    }
}

export class NoteDatabase {
    // private readonly vsnoteDbPath: string;
    private readonly contentFileNameRegex = /^([0-9])\.txt$/;
    private readonly notesPath: string;
    public notesCache: Map<string, string[]> = new Map(); // cache labels with nId, more notes of one label
    private notesCacheFileName = 'notes.cache.json'; // the file can deleted;
    private readonly notesCacheFile: string;

    constructor(masterPath: string) {
        // this.vsnoteDbPath = vsnoteDbPath
        this.notesPath = path.join(masterPath, 'notes');
        this.notesCacheFile = path.join(masterPath, this.notesCacheFileName);
        this.initDirectories();
        this.refresh(false);
    }

    private initDirectories() {
        if (!existsSync(this.notesPath)) {
            mkdirpSync(this.notesPath);
            const nId = this.create(['root'], 'root');
            this.createDoc(nId);
            this.createFiles(nId);
            vfs.writeFileSync(this.getContentFile(nId), 'hello world.');
        }
    }

    private checkCacheFileExpire(): boolean {
        return statSync(this.notesCacheFile).ctimeMs + 60 * 60 * 1000 < new Date().getTime();
    }

    // A hexadecimal number of 6 bytes is used for a unique note id.
    private generateNId(): string {
        const nId = tools.hexRandom(3);
        return existsSync(this.getDirectory(nId)) ? this.generateNId() : nId;
    }

    public getNIdsBylabels(labels: string[]): string[] {
        const nIds = labels.reduce((p_nIds, c_label) => {
            const __nIds = this.notesCache.get(c_label) || [];
            return p_nIds.filter((nId) => __nIds.includes(nId));
        }, this.notesCache.get(labels[0]) || []);
        return Array.from(new Set(nIds));
    }

    refresh(force: boolean) {
        if (force) {
            removeSync(this.notesCacheFile);
        }

        console.log('start notes cache.');
        if (existsSync(this.notesCacheFile) && !this.checkCacheFileExpire()) {
            this.notesCache = new Map(Object.entries(vfs.readJsonSync(this.notesCacheFile)));
            return;
        } else {
            removeSync(this.notesCacheFile);
        }

        console.log('notes cache start.', this.notesPath);
        for (const nId of readdirSync(this.notesPath)) {
            this.cache(nId, false);
        }
        this.persistence();
        console.log('notes cache success.', this.notesCache.size);
    }

    public removeCacheByLabels(nId: string, labels: string[]) {
        for (const label of labels) {
            const nIds = new Set(this.notesCache.get(label) || []);
            nIds.delete(nId);
            this.notesCache.set(label, Array.from(nIds));
        }
        return this;
    }

    public removeFromCache(nId: string) {
        for (const label of this.getMeta(nId).labels) {
            const nIds = new Set(this.notesCache.get(label) || []);
            nIds.delete(nId);
            this.notesCache.set(label, Array.from(nIds));
        }
        this.persistence();
    }

    public remove(nId: string) {
        const nd = this.getDirectory(nId);
        removeSync(nd);
    }

    public cache(nId: string, p: boolean): void {
        for (const label of this.getMeta(nId).labels) {
            const nIds = new Set(this.notesCache.get(label) || []);
            nIds.add(nId);
            this.notesCache.set(label, Array.from(nIds));
        }
        p && this.persistence();
    }
    // force is cover
    public updatelabels(nId: string, labels: string[]) {
        const nm = this.getMeta(nId);
        nm.labels = labels;
        this.updateMeta(nId, nm);
    }

    public getDirectory = (nId: string) => path.join(this.notesPath, nId);

    public getContentFile = (nId: string, cNumber: string = '1') => path.join(this.getDirectory(nId), `${cNumber}.txt`);

    public getShortDocumentContent = (nId: string, cNumber: string = '1') => vfs.readFileSync(this.getContentFile(nId, cNumber));

    public updateMeta = (nId: string, meta: NoteMeta) => vfs.writeJsonSync(this.getMetaFile(nId), meta);

    public persistence = () => vfs.writeJsonSync(this.notesCacheFile, Object.fromEntries(this.notesCache));

    public getMetaFile = (nId: string) => path.join(this.getDirectory(nId), metaFileName);

    public getMeta = (nId: string) => vfs.readJsonSync<NoteMeta>(this.getMetaFile(nId));

    public addCol(nId: string): string {
        const cnt = (this.getNoteContents(nId).length + 1).toString();
        vfs.writeFileSync(this.getContentFile(nId, cnt), '');
        return cnt;
    }
    public getNoteContents(nId: string): string[] {
        return this.getContentFiles(nId).map((f: string) => vfs.readFileSync(f));
    }

    public getContentFiles = (nId: string) =>
        readdirSync(this.getDirectory(nId))
            .filter((f: string) => this.contentFileNameRegex.test(f))
            .map((f: string) => this.contentFileNameRegex.exec(f)![1])
            .map((f: string) => this.getContentFile(nId, f));

    public create(labels: string[], category: string) {
        const nId = this.generateNId();
        mkdirSync(this.getDirectory(nId));
        this.updateMeta(nId, { labels, category }); // todo, domain + label
        this.addCol(nId);
        this.cache(nId, true);
        return nId;
    }

    public createDoc(nId: string) {
        mkdirSync(this.getDocPath(nId));
        vfs.writeFileSync(path.join(this.getDocPath(nId), 'README.md'));
    }

    public createFiles(nId: string) {
        mkdirSync(this.getFilesPath(nId));
    }

    public getDocPath = (nId: string) => path.join(this.getDirectory(nId), 'doc');

    public getFilesPath = (nId: string) => path.join(this.getDirectory(nId), 'files');
    public removeCol(nId: string, cIdx: number) {
        const colNum = this.getNoteContents(nId).length;
        // removeSync(this.getNoteContentFile(nId, num.toString()));
        this.archiveNoteCol(nId, cIdx);
        if (cIdx !== colNum) {
            for (let i = cIdx + 1; i <= colNum; i++) {
                const org = this.getContentFile(nId, i.toString());
                const tar = this.getContentFile(nId, (i - 1).toString());
                renameSync(org, tar);
            }
        }
    }

    archiveNoteCol(nId: string, cIdx: number) {
        const ts = new Date().getTime();
        const archiveFile = path.join(this.getDirectory(nId), `${cIdx}.${ts}.col`);
        renameSync(this.getContentFile(nId, cIdx.toString()), archiveFile);
    }

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
    public selectDocIndexFile = (nId: string) => {
        const indexFile = readdirSync(this.getDirectory(nId)).filter((f: string) => /^README\.*/.test(f))[0];
        return this.getDocIndexFile(nId, indexFile);
    };

    public selectDocReadmeFile = (nId: string) => {
        return this.getDocIndexFile(nId, 'README.md');
    };

    updateCategory(nId: string, newCategory: string) {
        const nm = this.getMeta(nId);
        nm.category = newCategory;
        this.updateMeta(nId, nm);
    }

    public getDocIndexFile = (nId: string, indexName: string) => path.join(this.getDocPath(nId), indexName);

    public checkDocExist(nId: string): boolean {
        return existsSync(this.getDocIndexFile(nId, 'README.md')); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public checkFilesExist = (nId: string) => existsSync(this.getFilesPath(nId));
}

export class DomainDatabase {
    private readonly masterPath: string;
    // private readonly shortcutsFile: string;
    public domain: Domain;
    private readonly domainFileName = 'domain.json';
    private readonly domainFile;
    public readonly noteDB: NoteDatabase;

    constructor(masterPath: string) {
        this.masterPath = masterPath;
        this.domainFile = path.join(this.masterPath, this.domainFileName);
        // this.shortcutsFile = path.join(this.vsnoteDbPath, 'shortcuts.json');
        this.initDirectories();
        this.noteDB = new NoteDatabase(masterPath);
        this.domain = vfs.readJsonSync(this.domainFile);
        const s = new Date().getTime();
        this.refresh();
        this.persistence();
        console.log('refresh domain success. time: ' + `${new Date().getTime() - s}`);
    }

    private initDirectories() {
        existsSync(this.masterPath) || mkdirpSync(this.masterPath);
        existsSync(this.domainFile) || vfs.writeJsonSync(this.domainFile, { root: { '.notes': [], '.labels': ['root'] } });
    }

    public refresh(domainNode: string[] = [], p: boolean = false): void {
        for (const keys of Object.keys(this.getDomain(domainNode)).filter((n) => !['.labels', '.notes'].includes(n))) {
            this.refreshDomainNodes(domainNode.concat(keys), p);
            this.refresh(domainNode.concat(keys), p);
        }
        if (p) this.persistence();
    }

    public refreshDomainNodes(domainNode: string[] = [], p: boolean): void {
        const domainLabels = this.getDomainLabels(domainNode);
        objectPath.set(this.domain, domainNode.concat('.notes'), []); // clear .notes field
        if (domainLabels.length >= 1) {
            const nIds = this.noteDB.getNIdsBylabels(domainLabels);
            objectPath.set(this.domain, domainNode.concat('.notes'), nIds);
        }
        if (p) this.persistence();
    }

    public updateLabels(domainNode: string[], labels: string[]) {
        const _labels = Array.from(new Set(labels));
        objectPath.set(this.domain, domainNode.concat('.labels'), _labels);
        this.persistence();
    }

    // public appendLabels(domainNode: string[], labels: string[]) {
    //     const sourceLabels: string[] = objectPath.get(this.domain, domainNode.concat('.labels'));
    //     this.updateLabels(domainNode, Array.from(new Set(sourceLabels.concat(labels))));
    // }

    public persistence(): void {
        vfs.writeJsonSync(this.domainFile, this.domain);
    }

    public getDomainLabels(domainNode: string[]): string[] {
        return this.getDomain(domainNode)['.labels'];
    }

    public deleteDomain(domainNode: string[]): void {
        objectPath.del(this.domain, domainNode);
        this.persistence();
    }

    public createDomain(dn: string[]) {
        for (let i = 1; i <= dn.length; i++) {
            const _dn = dn.slice(0, i);
            if (!objectPath.has(this.domain, _dn)) {
                objectPath.set(this.domain, dn.slice(0, i), { '.labels': [], '.notes': [] }, true);
            }
        }
        this.persistence();
    }

    // public appendNewDomain(domainNode: string[], category: string = 'default'): string {
    //     // const domainLabels = this.getDomainLabels(domainNode);
    //     const nId = this.noteDB.create(domainNode, category);
    //     // this.appendNote(domainNode, nId);
    //     this.appendLabels(domainNode, domainNode.concat([]));
    //     this.persistence();
    //     return nId;
    // }

    // public updateNotesOfDomain(orgDpath: string[], newDpath: string[], cascade: boolean) {
    //     this.selectAllNotes(orgDpath).forEach((nId) => this.updateNoteLabelsDomainByLabels(nId, orgDpath, newDpath, cascade));
    // }

    // public updateNoteLabelsDomainByLabels(_nId: string, oldDomainNode: string[], newDomainNode: string[], _cascade: boolean) {
    //     // todo remove labels
    //     // add new domain labels to notes
    //     // const noteMeta = this.readNoteMeta(nId);
    //     // // for (let i = 0; i < noteMeta.tags.length; i++) {
    //     // const metaPath = noteMeta.domain;
    //     // if (cascade) {
    //     //     if (tools.stringArrayEqual(orgDpath, metaPath.slice(0, orgDpath.length))) {
    //     //         noteMeta.domain = newDpath.concat(metaPath.slice(orgDpath.length));
    //     //     }
    //     // } else {
    //     //     if (tools.stringArrayEqual(orgDpath, metaPath)) {
    //     //         noteMeta.domain = newDpath;
    //     //     }
    //     // }
    //     // // }
    //     // this.writeNoteMeta(nId, noteMeta);
    // }

    // public moveNote(nId: string, oldDomainNode: string[], newDomainNode: string[]): void {
    //     const nm = this.noteDB.getMeta(nId);
    //     nm.labels = nm.labels.filter(l => !oldDomainNode.includes(l))
    //     nm.labels = Array.from(new Set(nm.labels.concat(newDomainNode)))
    //     this.noteDB.updatelabels(nId, nm.labels);
    //     this.removeNote(oldDomainNode, nId)
    //     this.appendNote(newDomainNode, nId)

    // }

    // public appendNote(domainNode: string[], nId: string, persistence: boolean = true) {
    //     objectPath.insert(this.domain, domainNode.concat('.notes'), nId);
    //     persistence && this.persistence()
    // }

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

    sortNotes(notes: string[]): string[] {
        // const items = [];
        // for (const note of notes) {
        //     const nm = this.readNoteMeta(note);
        //     // items.push({ note, weight: weight || 0 });
        // }
        // return items.sort((_a, b) => b.weight).map(i => i.note);
        return notes;
    }

    // getShortcutsList(kind: 'last' | 'star'): string[] {
    //     if (kind === 'last') {
    //         return vfs.readJsonSync<Shortcuts>(this.shortcutsFile).last;
    //     } else {
    //         return [];
    //     }
    // }

    // appendLastDomainToShortcuts(domain: string): void {
    //     const maxLast = 10;
    //     let last = this.getShortcutsList('last');
    //     const dns = this.getDomainNotes(Tools.splitDomaiNode(domain));
    //     if (dns.length === 0) {
    //         return;
    //     }
    //     last.push(domain);
    //     last = Array.from(new Set(last));
    //     while (last.length > maxLast) {
    //         last.shift();
    //     }
    //     const s = vfs.readJsonSync<Shortcuts>(this.shortcutsFile);
    //     s.last = last;
    //     vfs.writeJsonSync(this.shortcutsFile, s);
    // }

    public getDomainNotes(domainNode: string[] = []): string[] {
        return this.getDomain(domainNode)['.notes'];
    }

    public getDomain(domainNode: string[] = []): Domain {
        return objectPath.get(this.domain, domainNode);
    }

    // public selectDomainWithoutMeta(domainNode: string[] = []): Domain {
    //     return objectPath.get(this.domainCache, domainNode);
    // }

    public getAllNotesUnderDomain(domainNode: string[]): string[] {
        const domain = this.getDomain(domainNode);
        const childDomainNames: string[] = Object.keys(domain).filter((name) => !['.notes', '.labels'].includes(name));
        const notes: string[] = this.getDomainNotes(domainNode);
        if (childDomainNames.length === 0) {
            return notes;
        }

        const totalNotes: string[] = [];
        for (const name of childDomainNames) {
            const childDomainNotes: string[] = this.getAllNotesUnderDomain(domainNode.concat(name));
            totalNotes.push(...childDomainNotes);
        }
        return totalNotes.concat(notes);
    }
}
