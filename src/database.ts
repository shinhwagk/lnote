import * as path from 'path';

import * as objectPath from 'object-path';
import { existsSync, readdirSync, mkdirSync, renameSync, removeSync, statSync, mkdirpSync } from 'fs-extra';

import { metaFileName } from './constants';
import { tools, vfs } from './helper';
import { Tools } from './explorer/domainExplorer';

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
    // private readonly vsnoteDbPath: string;
    private readonly contentFileNameRegex = /^([0-9])\.txt$/;
    private readonly notesPath: string;
    private notesCache: Map<string, string[]> = new Map(); // cache labels with nId, more notes of one label
    private notesCacheFileName = 'notes.cache.json'; // the file can deleted;
    private readonly notesCacheFile: string;

    constructor(vsnoteDbPath: string) {
        // this.vsnoteDbPath = vsnoteDbPath
        this.notesPath = path.join(vsnoteDbPath, 'notes');
        this.initDirectories()
        this.notesCacheFile = path.join(vsnoteDbPath, this.notesCacheFileName);
        this.refresh(false);
    }

    private initDirectories() {
        existsSync(this.notesPath) || mkdirpSync(this.notesPath);
    }

    private checkCacheFileExpire(): boolean {
        return statSync(this.notesCacheFile).ctimeMs + 60 * 60 * 1000 < new Date().getTime();
    }

    // A hexadecimal number of 6 bytes is used for a unique note id.
    private generateNId(): string {
        const nId = tools.hexRandom(3);
        return existsSync(this.getDirectory(nId)) ? this.generateNId() : nId;
    }

    public getNIdsBylabels(labels: string[], exclude: string = '@Trash'): string[] {
        const excludeNIds: string[] = this.notesCache.get(exclude) || []!;
        const nIds = labels.reduce((nIds, label) => {
            const _nIds = this.notesCache.get(label) || [];
            return nIds.filter((nId) => _nIds.includes(nId) && !excludeNIds.includes(nId));
        }, this.notesCache.get(labels[0]) || []);
        return Array.from(new Set(nIds))
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
            this.cacheNote(nId, false);
        }
        this.persistence();
        console.log('notes cache success.', this.notesCache.size);
    }

    public removeCacheByLabels(nId: string, labels: string[], persistence: boolean = true): void {
        for (const label of labels) {
            if (this.notesCache.has(label)) {
                const idx = this.notesCache.get(label)?.indexOf(nId);
                if (idx !== undefined && idx >= 0) {
                    this.notesCache.get(label)?.splice(idx, 1);
                }
            }
        }
        if (persistence) this.persistence();
    }

    public cacheNote(nId: string, persistence: boolean = true): void {
        const labels = this.getMeta(nId).labels
        for (const label of labels) {
            if (this.notesCache.has(label) && this.notesCache.get(label)?.includes(nId)) {
                this.notesCache.get(label)?.push(nId)
            } else {
                this.notesCache.set(label, [nId]);
            }
        }
        if (persistence) this.persistence();
    }

    // force is cover
    public updatelabels(nId: string, labels: string[]) {
        const nm = this.getMeta(nId);
        nm.labels = labels;
        this.updateMeta(nId, nm);
    }

    public getDirectory = (id: string) => path.join(this.notesPath, id);

    public getContentFile = (nId: string, cNumber: string) => path.join(this.getDirectory(nId), `${cNumber}.txt`);

    public updateMeta = (nId: string, meta: NoteMeta) => vfs.writeJsonSync(this.getMetaFile(nId), meta);

    public persistence = () => vfs.writeJsonSync(this.notesCacheFile, Object.fromEntries(this.notesCache));

    public getMetaFile = (nId: string) => path.join(this.getDirectory(nId), metaFileName);

    public getMeta = (nId: string) => vfs.readJsonSync<NoteMeta>(this.getMetaFile(nId));

    public addCol(nid: string): string {
        const cnt = (this.selectContents(nid).length + 1).toString();
        vfs.writeFileSync(this.getContentFile(nid, cnt), '');
        return cnt;
    }
    public selectContents(nId: string): string[] {
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
        this.cacheNote(nId);
        return nId;
    }

    public createDoc(nId: string) {
        mkdirSync(this.getDocPath(nId));
        vfs.writeFileSync(path.join(this.getDocPath(nId), 'README.md'));
    }

    public createNoteFiles(nId: string) {
        mkdirSync(this.getFilesPath(nId));
    }

    public getDocPath = (nId: string) => path.join(this.getDirectory(nId), 'doc');

    public getFilesPath = (nId: string) => path.join(this.getDirectory(nId), 'files');
    public removeCol(nId: string, cIdx: number) {
        const colNum = this.selectContents(nId).length;
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
        return this.getDocIndexFile(nId, 'README.md')
    }

    updateCategory(nId: string, newCategory: string) {
        const nm = this.getMeta(nId);
        nm.category = newCategory;
        this.updateMeta(nId, nm);
    }

    public getDocIndexFile = (nId: string, indexName: string) => path.join(this.getDocPath(nId), indexName);

    public selectDocExist(nId: string): boolean {
        return existsSync(this.getDocIndexFile(nId, 'README.md')) || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public selectFilesExist = (nId: string) => existsSync(this.getFilesPath(nId));
}

export class DomainDatabase {
    private readonly vsnoteDbPath: string;
    private readonly shortcutsFile: string;
    public domain: Domain;
    private readonly domainFileName = 'domain.json';
    private readonly domainFile;
    public readonly noteDB: NoteDatabase;

    constructor(vsnoteDbPath: string) {
        this.vsnoteDbPath = vsnoteDbPath;
        this.domainFile = path.join(this.vsnoteDbPath, this.domainFileName);
        this.shortcutsFile = path.join(this.vsnoteDbPath, 'shortcuts.json');
        this.initDomain()
        this.noteDB = new NoteDatabase(vsnoteDbPath);
        this.domain = vfs.readJsonSync(this.domainFile);
        this.refresh();
    }

    private initDomain() {
        existsSync(this.vsnoteDbPath) || mkdirpSync(this.vsnoteDbPath);
        existsSync(this.domainFile) || vfs.writeJsonSync(this.domainFile, { "@Trash": { '.notes': [], '.labels': [] } })
    }

    public refresh(domainNode: string[] = []): void {
        this.refreshDomain(domainNode);
        this.persistence();
    }

    public refreshDomain(domainNode: string[] = []): void {
        if (domainNode.length === 0) {
            for (const keys of Object.keys(this.select(domainNode)).filter((n) => !['.labels', '.notes'].includes(n))) {
                this.refreshDomain(domainNode.concat(keys));
            }
        } else {
            const domainLabels = this.getDomainLabels(domainNode);
            objectPath.set(this.domain, domainNode.concat('.notes'), []); // clear .notes cache
            if (domainLabels.length >= 1) {
                const exclude = domainNode[0] === '@Trash' ? '' : '@Trash';
                const nIds = this.noteDB.getNIdsBylabels(domainLabels, exclude);
                objectPath.set(this.domain, domainNode.concat('.notes'), nIds);
            }
        }
    }

    public updateLabels(domainNode: string[], labels: string[]) {
        console.log(domainNode, labels)
        objectPath.set(this.domain, domainNode.concat('.labels'), labels);
        return this
    }

    public appendLabels(domainNode: string[], labels: string[]) {
        const sourceLabels: string[] = objectPath.get(this.domain, domainNode.concat('.labels'));
        this.updateLabels(domainNode, Array.from(new Set(sourceLabels.concat(labels))));
    }

    public persistence(): void {
        vfs.writeJsonSync(this.domainFile, this.domain);
    }

    public getDomainLabels(domainNode: string[]): string[] {
        return this.select(domainNode)['.labels'];
    }

    public createDomain(dn: string[]) {
        for (let i = 1; i <= dn.length; i++) {
            const _dn = dn.slice(0, i)
            if (!objectPath.has(this.domain, _dn)) {
                objectPath.set(this.domain, dn.slice(0, i), { '.labels': [], '.notes': [] }, true);
            }
        }
        return this
    }

    public appendNewDomain(domainNode: string[], category: string = 'default'): string {
        // const domainLabels = this.getDomainLabels(domainNode);
        const nId = this.noteDB.create(domainNode, category);
        this.appendNote(domainNode, nId);
        this.appendLabels(domainNode, domainNode.concat([]));
        this.persistence();
        return nId;
    }

    public updateNotesOfDomain(orgDpath: string[], newDpath: string[], cascade: boolean) {
        this.selectAllNotes(orgDpath).forEach((nId) => this.updateNoteLabelsDomainByLabels(nId, orgDpath, newDpath, cascade));
    }


    public updateNoteLabelsDomainByLabels(_nId: string, oldDomainNode: string[], newDomainNode: string[], _cascade: boolean) {
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

    // public moveNote(nId: string, oldDomainNode: string[], newDomainNode: string[]): void {
    //     const nm = this.noteDB.getMeta(nId);
    //     nm.labels = nm.labels.filter(l => !oldDomainNode.includes(l))
    //     nm.labels = Array.from(new Set(nm.labels.concat(newDomainNode)))
    //     this.noteDB.updatelabels(nId, nm.labels);
    //     this.removeNote(oldDomainNode, nId)
    //     this.appendNote(newDomainNode, nId)

    // }

    public appendNote(domainNode: string[], nId: string, persistence: boolean = true) {
        objectPath.insert(this.domain, domainNode.concat('.notes'), nId);
        persistence && this.persistence()
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
        const dns = this.selectNotes(Tools.splitDomaiNode(domain));
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

    public selectNotes(domainNode: string[] = []): string[] {
        console.log('selectNotes', domainNode, JSON.stringify(this.domain))
        const nIds = this.select(domainNode)['.notes']
        return nIds
        // if (domainNode[0] === '@Trash') {
        //     return nIds
        // } else {
        //     // nIds.
        // }

    }

    public select(domainNode: string[] = []): Domain {
        return objectPath.get(this.domain, domainNode);
    }

    // public selectDomainWithoutMeta(domainNode: string[] = []): Domain {
    //     return objectPath.get(this.domainCache, domainNode);
    // }

    public selectAllNotes(domainNode: string[]): string[] {
        const domain = this.select(domainNode);
        const childDomainNames: string[] = Object.keys(domain).filter((name) => !['.notes', '.labels'].includes(name));
        const notes: string[] = domain['.notes'];
        if (childDomainNames.length === 0) {
            return notes;
        }

        const totalNotes: string[] = [];
        for (const name of childDomainNames) {
            const childDomainNotes: string[] = this.selectAllNotes(domainNode.concat(name));
            totalNotes.push(...childDomainNotes);
        }
        return totalNotes.concat(notes);
    }
}
