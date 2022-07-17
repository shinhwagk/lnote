import * as path from 'path';

import * as objectPath from 'object-path';
import {
    existsSync,
    readdirSync,
    statSync,
    mkdirpSync,
    readFileSync,
    writeJSONSync,
    writeFileSync,
    readFile,
    removeSync
} from 'fs-extra';

import { tools, vfs, } from './helper';
import { pathSplit } from './constants';
// import { Tools } from './explorer/domainExplorer';

export interface Domain {
    [domain: string]: Domain;
}

export interface Note {
    nId: string;
    cIdx: number;
    nIdx: number;
    category: string;
    contents: string[];
    isFiles: boolean;
    isDoc: boolean;
}

interface NoteBook {
    domain: Domain
    notes: { [id: string]: { contents: string[] } }

}

export class NotesDatabase {
    private readonly masterPath: string;
    // private readonly shortcutsFile: string;
    public domainTreeCache = {};
    public notebookCache: NoteBook = { domain: {}, notes: {} };
    public cacheDirectory;
    // private readonly domainCacheName = 'domain.cache.json';
    // private readonly domainCacheFile;
    // public readonly noteDB: NoteDatabase;

    constructor(masterPath: string) {
        this.masterPath = masterPath;
        this.cacheDirectory = path.join(masterPath, '.cache')
        // this.domainCacheFile = path.join(this.masterPath, this.domainCacheName);
        // this.shortcutsFile = path.join(this.vsnoteDbPath, 'shortcuts.json');
        this.initDirectories();
        // this.noteDB = new NoteDatabase(masterPath);
        // this.domainCache = vfs.readJsonSync(this.domainCacheFile);
        const s = new Date().getTime();
        this.refresh();
        console.log('refresh domain success. time: ' + `${new Date().getTime() - s}`);
    }

    private initDirectories() {
        existsSync(this.masterPath) || mkdirpSync(this.masterPath);
        existsSync(this.cacheDirectory) || mkdirpSync(this.cacheDirectory);
        // existsSync(this.notesCacheDirectory) || mkdirpSync(this.notesCacheDirectory);
    }

    public refresh(domainNode: string[] | undefined = undefined): void {
        if (domainNode !== undefined) {
            objectPath.set(this.domainTreeCache, domainNode, {});
        } else {
            this.buildNoteBookCache();
        }
    }

    public buildNoteBookCache() {
        for (const nbName of readdirSync(this.masterPath).filter(f => f.endsWith('.yaml')).map(f => f.split('.')[0])) {
            const nb = tools.readYamlSync(this.getNoteBookFile(nbName))
            objectPath.set(this.domainTreeCache, [nbName], nb['domain'][nbName])
        }
    }

    public recacheNoteBook(nbName: string) {
        const nb = tools.readYamlSync(this.getNoteBookFile(nbName))
        objectPath.set(this.domainTreeCache, [nbName], nb['domain'][nbName])
    }

    public getNoteBookFile = (domainName: string) => path.join(this.masterPath, `${domainName}.yaml`)

    public cacheNoteBook(notebook: string) {
        this.notebookCache = tools.readYamlSync(this.getNoteBookFile(notebook))
    }
    // public refreshDomainNodes(domainNode: string[] = [], p: boolean): void {
    //     const domainLabels = this.getDomainLabels(domainNode);
    //     objectPath.set(this.domainCache, domainNode.concat('.notes'), []); // clear .notes field
    //     if (domainLabels.length >= 1) {
    //         const nIds = this.noteDB.getNIdsBylabels(domainLabels);
    //         objectPath.set(this.domainCache, domainNode.concat('.notes'), nIds);
    //     }
    //     if (p) 
    // }


    // public appendLabels(domainNode: string[], labels: string[]) {
    //     const sourceLabels: string[] = objectPath.get(this.domain, domainNode.concat('.labels'));
    //     this.updateLabels(domainNode, Array.from(new Set(sourceLabels.concat(labels))));
    // }

    // public getDomainLabels(domainNode: string[]): string[] {
    //     return this.getDomain(domainNode)['.labels'];
    // }

    public deleteDomain(domainNode: string[]): void {
        objectPath.del(this.domainTreeCache, domainNode);
    }

    public createDomain(domainNode: string[]) {
        const nb = domainNode[0]
        this.cacheNoteBook(nb)

        objectPath.set(this.domainTreeCache, domainNode, {});
    }

    public removeNote(domainNode: string[], category: string, nId: string) {
        const notes = this.getCategoriesOfDomain(domainNode)
        const ns = notes[category]
        // console.log(domainNode, category, nId)


    }

    public addNote(domainNode: string[], category: string) {
        const categories = this.getCategoriesOfDomain(domainNode)
        const notes = this.notebookCache.notes
        const nId = generateNId()
        categories[category].push(nId)
        notes[nId] = { contents: [] }
        this.persistenceNotebook(domainNode[0], this.notebookCache)
        return nId
    }

    public addCategory(domainNode: string[], category: string) {
        const notes = this.getCategoriesOfDomain(domainNode)
        notes[category] = []
        // this.persistenceNotes(domainNode, notes)
    }

    public createNotes(domainNode: string[], category: string = 'default') {
        // this.persistenceNotes(domainNode, {})
        this.addCategory(domainNode, category)
    }


    public getCategoriesOfDomain(domainNode: string[]): any {
        return objectPath.get(this.notebookCache, ['domain', ...domainNode])['.categories']
    }

    public getNoteBookDirectory = (notebook: string) => path.join(this.masterPath, notebook);

    public getNoteFile = (domainNode: string[], fileName: string) =>
        path.join(this.masterPath, domainNode.join(pathSplit), fileName);

    // public getDomainMeta(domainNode: string[]): any {
    //     return readJsonSync(path.join(this.masterPath, domainNode.join(pathSplit), 'meta.json'), { encoding: 'utf8' });
    // }

    public getDomain(domainNode: string[] = []): Domain {
        return objectPath.get(this.domainTreeCache, domainNode);
    }

    public getChildrenNameOfDomain(domainNode: string[] = []): string[] {
        return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.categories');
    }

    public getRootDomain(): string[] {
        // const domain = this.domainCache.get(domainNode[0])
        return [...Object.keys(this.domainTreeCache)]
    }

    // public selectDomainWithoutMeta(domainNode: string[] = []): Domain {
    //     return objectPath.get(this.domainCache, domainNode);
    // }

    public getAllNotesNumberOfDomain(domainNode: string[]): number {
        let cnt = 0
        for (const domainPath of readdirSync(this.masterPath)) {
            if (domainPath.startsWith(domainNode.join(pathSplit))) {
                for (const notes of Object.values<any[]>(this.getCategoriesOfDomain(domainPath.split(pathSplit)))) {
                    cnt += notes.length
                }
            }
        }
        return cnt
    }

    public updateNoteContent(noteBookName: string, nId: string, contents: string[]) {
        this.cacheNoteBook(noteBookName)
        console.log(noteBookName, nId, contents)
        this.notebookCache.notes[nId].contents = contents
        this.persistenceNotebook(noteBookName, this.notebookCache)
        // writeFileSync(this.getNoteBookFile(noteBookName), yaml.stringify(this.notebookCache), { encoding: 'utf8' })
    }

    // public getNotesOfNoteBook(domainNode: string[]): { [nId: string]: { contents: string[] } } {
    //     return this.notebookCache['notes']
    // }

    public createEditNoteEnv(notebookName: string, nId: string, mode: 'edit' | 'add' | 'del' = 'edit') {
        const note = this.notebookCache.notes[nId]
        vfs.writeFileSync(path.join(this.cacheDirectory, `${notebookName}_${nId}.txt`), note.contents.join("\n+=+=+=+=\n"))
        return path.join(this.cacheDirectory, `${notebookName}_${nId}.txt`)
    }

    public removeEditNoteEnv(notebookName: string, nId: string) {
        removeSync(path.join(this.masterPath, '.cache', `${notebookName}_${nId}.txt`))
    }

    public checkDocExist(domainNode: string[], nId: string): boolean {
        return existsSync(path.join(this.masterPath, domainNode[0], `${nId}_doc`)); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public checkFilesExist = (domainNode: string[], nId: string) => existsSync(path.join(this.masterPath, domainNode[0], `${nId}_files`));

    public createCategory(domainNode: string[], category: string = 'default') {
        const notes = this.getCategoriesOfDomain(domainNode)
        notes[category] = []
        // this.persistenceNotebook(domainNode, notes)
    }

    public persistenceNotebook(noteBookName: string, notebook: any) {
        tools.writeYamlSync(this.getNoteBookFile(noteBookName), notebook)
    }

    public checkNotesExist(domainNode: string[]) {
        console.log(this.getDomain(domainNode))
        return this.getDomain(domainNode)['.categories'] !== undefined
    }

    public getFilesPath = (domainNode: string[], nId: string) => path.join(this.masterPath, domainNode.join(pathSplit), `${nId}_files`)


}

// public checkDocExist(nId: string): boolean {
//     return existsSync(this.getDocIndexFile(nId, 'README.md')); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
// }

// public checkFilesExist = (nId: string) => existsSync(this.getFilesPath(nId));

// export function parseNoteFile(f: string): Note {
//     const [cIdx, nIdx, nId] = basename(f.split('.')[0]).split('_');
//     const noteFilePhth = dirname(f);
//     const isDoc = existsSync(path.join(noteFilePhth, `${nId}_doc`));
//     const isFiles = existsSync(path.join(noteFilePhth, `${nId}_files`));
//     const arr = readFileSync(f, { encoding: 'utf8' })
//         .split(columnSplit)
//         .filter((e) => e !== '==+')
//         .map((e) => e.trim());
//     return { category: arr[0], contents: arr.slice(1), cIdx: Number(cIdx), nIdx: Number(nIdx), nId, isDoc, isFiles };
// }
function generateNId(): string {
    return tools.hexRandom(3);
}

interface DomainInterface {
    createDomain(): void
    deleteDomain(): void
    renameDomain(): void
}