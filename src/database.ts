import { readdirSync, mkdirSync, existsSync, removeSync, renameSync, ensureFileSync } from 'fs-extra';
import * as objectPath from 'object-path';
import { nonNoteData, metaFileName } from './constants';
import { vpath, vfs, tools } from './helper';
import * as path from 'path';

export interface Domain {
    '.notes': string[];
    [domain: string]: string[] | Domain;
}

export interface Tags {
    tags: Tag[];
}

export interface Tag {
    domain: string;
    category: string;
}

export class DatabaseFileSystem {
    private dbDirPath: string;
    private trashPath: string;
    private readonly contentFileNameRegex = /^([0-9])\.txt$/;
    readonly dch: DomainCache = new DomainCache();

    constructor(dbDirPath: string) {
        this.dbDirPath = dbDirPath;
        this.trashPath = path.join(dbDirPath, 'trash');
        this.initialize();
        this.cacheAllNotes();
    }

    insertNotesByMeta(...notes: string[]) {
        for (const nId of notes) {
            if (!this.checkNoteMetaExist(nId)) {
                console.warn(`note cache error note id '${nId}' '.n.yml' not exist.`);
                continue;
            }
            const meta = this.readNoteMeta(nId);
            for (const tag of meta.tags) {
                this.dch.insertNotesByDpath(vpath.splitPath(tag.domain), nId);
            }
        }
    }

    private cacheAllNotes() {
        this.dch.cleanCache();
        const notes = readdirSync(this.dbDirPath).filter(f => nonNoteData.filter(nn => nn === f).length === 0);
        this.insertNotesByMeta(...notes);
    }

    getNoteDocIndexFile = (nId: string, indexName: string) => path.join(this.getNoteDocPath(nId), indexName);

    getNoteDocPath = (nId: string) => path.join(this.getNotePath(nId), 'doc');

    getNoteFilesPath = (nId: string) => path.join(this.getNotePath(nId), 'files');

    getNotePath = (id: string) => path.join(this.dbDirPath, id);

    getTrashNotePath = (id: string) => path.join(this.trashPath, id);

    getNoteMetaFile = (id: string) => path.join(this.getNotePath(id), metaFileName);

    readNoteMeta = (id: string) => vfs.readYamlSync<Tags>(this.getNoteMetaFile(id));

    checkNoteMetaExist = (id: string) => existsSync(this.getNoteMetaFile(id))

    selectFilesExist = (nId: string) => existsSync(this.getNoteFilesPath(nId));

    getNoteContentFile = (nId: string, cNumber: string) => path.join(this.getNotePath(nId), `${cNumber}.txt`);

    getNoteContentFiles = (nId: string) =>
        readdirSync(this.getNotePath(nId))
            .filter(f => this.contentFileNameRegex.test(f))
            .map(f => this.contentFileNameRegex.exec(f)![1])
            .map(f => this.getNoteContentFile(nId, f))

    selectDocIndexFile = (nId: string) => {
        const indexFile = readdirSync(this.getNoteDocPath(nId)).filter(f => /^README\.*/.test(f))[0];
        return this.getNoteDocIndexFile(nId, indexFile);
    }

    writeNoteMeta = (id: string, meta: Tags) => vfs.writeYamlSync(this.getNoteMetaFile(id), meta);

    selectDocExist(nId: string): boolean {
        return (
            existsSync(this.getNoteDocIndexFile(nId, 'README.md')) ||
            existsSync(this.getNoteDocIndexFile(nId, 'README.html')) ||
            existsSync(this.getNoteDocIndexFile(nId, 'README.htm'))
        );
    }

    selectNoteContents(nId: string): string[] {
        return this.getNoteContentFiles(nId).map(f => vfs.readFileSync(f));
    }

    genNewSeq(): string {
        const id = tools.hexRandom(3);
        return existsSync(this.getNotePath(id)) ? this.genNewSeq() : id;
    }

    createExampleData(): void {
        const nId = this.genNewSeq();
        const notePath: string = this.getNotePath(nId);
        vfs.mkdirsSync(notePath);
        vfs.writeFileSync(this.getNoteContentFile(nId, '1'), 'windows');
        vfs.writeFileSync(this.getNoteContentFile(nId, '2'), 'chose install powershell');
        vfs.writeFileSync(
            path.join(notePath, metaFileName),
            'tags:\n    - domain: powershell/install\n      category: install'
        );
        vfs.mkdirsSync(this.getNoteDocPath(nId));
        vfs.writeFileSync(this.getNoteDocIndexFile(nId, 'README.md'), '# example. \n example.');
        vfs.mkdirsSync(this.getNoteFilesPath(nId));
        vfs.writeFileSync(path.join(this.getNoteFilesPath(nId), 'example_01.sh'), 'echo aa');
        vfs.writeFileSync(path.join(this.getNoteFilesPath(nId), 'example_02.ts'), 'console.log("aa")');
    }

    initialize(): void {
        if (!existsSync(this.dbDirPath)) {
            vfs.mkdirsSync(this.dbDirPath);
            this.createExampleData();
        }
        if (!existsSync(this.trashPath)) mkdirSync(this.trashPath);
    }

    createNode(dpath: string[], category: string = 'default'): string {
        const newId = this.genNewSeq();
        mkdirSync(this.getNotePath(newId));
        this.writeNoteMeta(newId, { tags: [{ domain: dpath.join('/'), category }] });
        this.createNoteCol(newId);
        this.dch.insertNotesByDpath(dpath, newId);
        return newId;
    }

    createNoteCol(nid: string): string {
        const cnt = (this.selectNoteContents(nid).length + 1).toString();
        vfs.writeFileSync(this.getNoteContentFile(nid, cnt), '');
        return cnt;
    }

    deleteNoteCol(nid: string, num: number) {
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

    //     const cacheTime = statSync(storageDomainCacheFile).mtimeMs;
    //     if(!existsSync(storageDomainCacheFile) || storageTimeOut(cacheTime)) {
    //     await initializeDomainCache();
    // } else {
    //     await restoreDomainCache();
    // }

    updateNotesPath(orgDpath: string[], newDpath: string[], cascade: boolean) {
        this.dch
            .selectAllNotesUnderDomain(orgDpath)
            .forEach(nId => this.updateNoteTagPath(nId, orgDpath, newDpath, cascade));
    }

    updateNoteTagPath(nId: string, orgDpath: string[], newDpath: string[], cascade: boolean) {
        const noteMeta = this.readNoteMeta(nId);
        for (let i = 0; i < noteMeta.tags.length; i++) {
            const metaPath = vpath.splitPath(noteMeta.tags[i].domain);
            if (cascade) {
                if (tools.stringArrayEqual(orgDpath, metaPath.slice(0, orgDpath.length)))
                    noteMeta.tags[i].domain = newDpath.concat(metaPath.slice(orgDpath.length)).join('/');
            } else {
                if (tools.stringArrayEqual(orgDpath, metaPath)) noteMeta.tags[i].domain = newDpath.join('/');
            }
        }
        this.writeNoteMeta(nId, noteMeta);
    }

    createNoteDoc(nId: string) {
        mkdirSync(this.getNoteDocPath(nId));
        ensureFileSync(path.join(this.getNoteDocPath(nId), 'README.md'));
    }

    createNoteFiles(nId: string) {
        mkdirSync(this.getNoteFilesPath(nId));
    }
}

class DomainCache {
    private cache: Domain = { '.notes': [] };

    cleanCache() {
        this.cache = { '.notes': [] };
    }

    createDomain(dpath: string[], name: string): void {
        objectPath.set(this.cache, dpath.concat(name), {}, true);
    }

    deleteDomain(dpath: string[]) {
        objectPath.del(this.cache, dpath);
    }

    insertNotesByDpath(dpath: string[], ...notes: string[]): void {
        const domainNotesPath = dpath.concat('.notes');
        const orgNotes = objectPath.get<string[]>(this.cache, domainNotesPath, []);
        objectPath.set(this.cache, domainNotesPath, Array.from(new Set(orgNotes.concat(notes))));
    }

    removeNotes(dpath: string[], ...nId: string[]): void {
        const domainNotesPath = dpath.concat('.notes');
        const notes = objectPath.get<string[]>(this.cache, domainNotesPath, []);
        objectPath.set(this.cache, domainNotesPath, notes.filter((i: string) => !nId.includes(i)));
    }

    createNotes(dpath: string[]): void {
        objectPath.set(this.cache, dpath.concat('.notes'), []);
    }

    selectDomain(dpath: string[] = []): Domain {
        return objectPath.get(this.cache, dpath);
    }

    selectNotesUnderDomain(dpath: string[]): string[] {
        return this.selectDomain(dpath)['.notes'] || [];
    }

    selectAllNotesUnderDomain(dpath: string[]): string[] {
        const domain = this.selectDomain(dpath);
        const childDomainNames: string[] = Object.keys(domain).filter(name => name !== '.notes');
        const notes: string[] = this.selectNotesUnderDomain(dpath);
        if (childDomainNames.length === 0) return notes;

        const totalNotes: string[] = [];
        for (const name of childDomainNames) {
            const childDomainNotes: string[] = this.selectAllNotesUnderDomain(dpath.concat(name));
            totalNotes.push(...childDomainNotes);
        }
        return totalNotes.concat(notes);
    }
}
