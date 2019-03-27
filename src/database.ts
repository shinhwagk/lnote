import { readdirSync, mkdirSync, existsSync, moveSync } from 'fs-extra';
import * as objectPath from 'object-path';
import { noNoteDirs, metaFileName } from './constants';
import { vpath, vfs } from './helper';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { window } from 'vscode';

export interface Domain {
    '.notes': string[];
    [domain: string]: string[] | Domain;
}

export interface Tags {
    tags: Tag[];
}

export interface Tag {
    tag: string;
    category: string;
}

export class DatabaseFileSystem {
    dbDirPath: string;
    trashPath: string;
    storageDomainCacheFile: string;
    domainCache: Domain = { '.notes': [] };
    contentFileNameRegex = /^([0-9])\.txt$/;

    constructor(dbDirPath: string) {
        this.dbDirPath = dbDirPath;
        this.trashPath = path.join(dbDirPath, 'trash');
        this.storageDomainCacheFile = path.join(dbDirPath, '.domainCache.json');
        this.initialize();
        this.cacheDomain();
    }

    cacheDomain() {
        for (const id of readdirSync(this.dbDirPath)
            .filter(f => !noNoteDirs.filter(nn => nn === f).length)) {
            const noteMeta = this.selectNoteMeta(id);
            for (const tag of noteMeta.tags) {
                const notesPath = vpath.splitPath(tag.tag).concat(['.notes']);
                objectPath.push(this.domainCache, notesPath, id);
            }
        }
    }

    createDomain(dpath: string[], name: string): void {
        const oPath = dpath.concat(name);
        objectPath.set(this.domainCache, oPath, { '.notes': [] }, true);
    }

    insertDomain(dpath: string[], domain: Domain) {
        objectPath.set(this.domainCache, dpath, domain);
    }

    deleteDomain(dpath: string[]): void {
        objectPath.del(this.domainCache, dpath);
    }

    insertNote(dpath: string[], nId: string): void {
        const notes = objectPath.get<string[]>(this.domainCache, dpath.concat('.notes'), []);
        notes.push(nId);
        objectPath.set(this.domainCache, dpath, Array.from(new Set(notes)));
    }

    selectDomain(dpath: string[]): Domain {
        return objectPath.get(this.domainCache, dpath);
    }

    restoreDomainCache(): void {
        this.domainCache = vfs.readJsonSync(this.storageDomainCacheFile);
    }

    storageDomainCache(): void {
        (async () => vfs.writeJsonSync(this.storageDomainCacheFile, this.domainCache))().catch(console.error);
    }

    selectNotesUnderDomain(dpath: string[]): string[] {
        const domain = this.selectDomain(dpath);
        return domain['.notes'] ? domain['.notes'] : [];
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

    getNoteDocIndexFile = (nId: string, indexName: string) => path.join(this.getNoteDocPath(nId), indexName);

    getNoteDocPath = (nId: string) => path.join(this.getNotePath(nId), 'doc');

    getNoteFilesPath = (nId: string) => path.join(this.getNotePath(nId), 'files');

    getNotePath = (id: string) => path.join(this.dbDirPath, id);

    getTrashNotePath = (id: string) => path.join(this.trashPath, id);

    getNoteMetaFile = (id: string) => path.join(this.getNotePath(id), metaFileName);

    selectNoteMeta = (id: string) => vfs.readYamlSync<Tags>(this.getNoteMetaFile(id));

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
        return existsSync(this.getNoteDocIndexFile(nId, 'README.md')) ||
            existsSync(this.getNoteDocIndexFile(nId, 'README.html')) ||
            existsSync(this.getNoteDocIndexFile(nId, 'README.htm'));
    }

    selectNoteContents(nId: string): string[] {
        return this.getNoteContentFiles(nId).map(f => vfs.readFileSync(f));
    }

    genNewSeq(): string {
        const id = randomBytes(3).toString('hex');
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
            'tags:\n    - tag: /powershell/install\n      category: install'
        );
        vfs.mkdirsSync(this.getNoteDocPath(nId));
        vfs.writeFileSync(this.getNoteDocIndexFile(nId, 'README.md'), 'example.');
        vfs.mkdirsSync(this.getNoteFilesPath(nId));
        vfs.writeFileSync(path.join(this.getNoteFilesPath(nId), 'example_01.txt'), 'example 01.');
        vfs.writeFileSync(path.join(this.getNoteFilesPath(nId), 'example_02.txt'), 'example 02.');
    }

    initialize(): void {
        if (!existsSync(this.dbDirPath)) {
            vfs.mkdirsSync(this.dbDirPath); this.createExampleData();
        }
        if (!existsSync(this.trashPath)) mkdirSync(this.trashPath);
    }

    createNode(dpath: string[], category: string = 'default'): string {
        const newId = this.genNewSeq();
        mkdirSync(this.getNotePath(newId));
        this.writeNoteMeta(newId, { tags: [{ tag: dpath.join('/'), category }] });
        this.createNodeCol(newId);
        this.insertNote(dpath, newId);
        return newId;
    }

    deleteNote(dpath: string[], nId: string): void {
        moveSync(this.getNotePath(nId), this.getTrashNotePath(nId));
        const notes = objectPath.get(this.domainCache, dpath);
        objectPath.set(this.domainCache, dpath, notes.filter((n: string) => n !== nId));
    }

    createNodeCol(nid: string): string {
        const cnt = (readdirSync(this.getNotePath(nid)).filter(f => this.contentFileNameRegex.test(f)).length + 1).toString();
        vfs.writeFileSync(this.getNoteContentFile(nid, cnt), '');
        return cnt;
    }

    storageTimeOut = (m: number) => (new Date()).getTime() - m > 1000 * 60 * 60;
    //     const cacheTime = statSync(storageDomainCacheFile).mtimeMs;
    //     if(!existsSync(storageDomainCacheFile) || storageTimeOut(cacheTime)) {
    //     await initializeDomainCache();
    // } else {
    //     await restoreDomainCache();
    // }


}
