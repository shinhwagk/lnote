import * as path from 'path';

import * as objectPath from 'object-path';
import {
    existsSync,
    readdirSync,
    mkdirpSync,
    removeSync
} from 'fs-extra';

import { tools, vfs, } from './helper';
import { pathSplit } from './constants';
// import { Tools } from './explorer/domainExplorer';

export interface NotebookDomain {
    [domain: string]: NotebookDomain;
    '.categories'?: any;
}

export interface NotebookNote {
    nId: string;
    cIdx: number;
    nIdx: number;
    category: string;
    contents: string[];
    isFiles: boolean;
    isDoc: boolean;
}

interface Notebook {
    domain: NotebookDomain
    notes: { [id: string]: { contents: string[] } }
}

export class NoteBookDatabase {
    private readonly masterPath: string;
    // private readonly shortcutsFile: string;
    public domainTreeCache = {};
    public notebookCache: Notebook = { domain: {}, notes: {} };
    public notesCacheDirectory: string;
    // private readonly domainCacheName = 'domain.cache.json';
    // private readonly domainCacheFile;
    // public readonly noteDB: NoteDatabase;

    constructor(masterPath: string) {
        this.masterPath = masterPath;
        this.notesCacheDirectory = path.join(this.masterPath, '.cache')
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
        existsSync(this.notesCacheDirectory) || mkdirpSync(this.notesCacheDirectory);
    }

    public refresh(domainNode: string[] | undefined = undefined): void {
        if (domainNode !== undefined) {
            objectPath.set(this.domainTreeCache, domainNode, {});
        } else {
            this.cacheAllNoteBook();
        }
    }

    public cacheAllNoteBook() {
        for (const nbName of readdirSync(this.masterPath).filter(f => f.endsWith('.yaml')).map(f => f.split('.')[0])) {
            this.cacheNoteBook(nbName)
        }
    }

    public readNotebook(nbName: string): Notebook {
        return tools.readYamlSync(this.getNoteBookFile(nbName))
    }

    public writeNotebook(nbName: string, notebook: any) {
        tools.writeYamlSync(this.getNoteBookFile(nbName), notebook)
    }

    public cacheNoteBook(nbName: string) {
        const nb = this.readNotebook(nbName)
        objectPath.set(this.domainTreeCache, [nbName], nb['domain'][nbName])
        this.notebookCache = nb
    }

    public getNoteBookFile = (domainName: string) => path.join(this.masterPath, `${domainName}.yaml`)

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

    public deleteDomain(domainNode: string[], withNotes: boolean): void {
        const nbName = domainNode[0]
        objectPath.del(this.domainTreeCache, domainNode);
        const nb = this.readNotebook(nbName)
        objectPath.del(nb, ['domain', ...domainNode])
        this.writeNotebook(nbName, nb)
    }

    public createDomain(domainNode: string[]) {
        const nbName = domainNode[0]
        const nb: Notebook = tools.readYamlSync(this.getNoteBookFile(nbName))
        objectPath.set(nb, ['domain'].concat(domainNode), {})
        this.writeNotebook(nbName, nb)
        objectPath.set(this.domainTreeCache, [nbName], nb['domain'][nbName])
        this.cacheNoteBook(nbName)
    }

    public removeNote(domainNode: string[], category: string, nId: string, deep = false) {
        const notes = this.getCategoriesOfNotebook(domainNode)
        const nIds: string[] = notes[category]
        notes[category] = nIds.filter(n => n !== nId)
        if (deep) {
            delete this.notebookCache['notes'][nId]
        }
        this.writeNotebook(domainNode[0], this.notebookCache)
    }

    public addNote(domainNode: string[], category: string) {
        const categories = this.getCategoriesOfNotebook(domainNode)
        const notes = this.notebookCache.notes
        const nId = generateNId()
        categories[category].push(nId)
        notes[nId] = { contents: [] }
        this.writeNotebook(domainNode[0], this.notebookCache)
        return nId
    }

    public addCategory(domainNode: string[], category: string) {
        const notes = this.getCategoriesOfNotebook(domainNode)
        notes[category] = []
        // this.persistenceNotes(domainNode, notes)
    }

    public createNotes(domainNode: string[], category: string = 'default') {
        // this.persistenceNotes(domainNode, {})
        this.addCategory(domainNode, category)
    }

    public getCategoriesOfNotebook(domainNode: string[]): any {
        return objectPath.get(this.notebookCache, ['domain', ...domainNode])['.categories']
    }

    public getNoteBookDirectory = (notebook: string) => path.join(this.masterPath, notebook);

    public getNoteFile = (domainNode: string[], fileName: string) =>
        path.join(this.masterPath, domainNode.join(pathSplit), fileName);

    // public getDomainMeta(domainNode: string[]): any {
    //     return readJsonSync(path.join(this.masterPath, domainNode.join(pathSplit), 'meta.json'), { encoding: 'utf8' });
    // }

    public getDomain(domainNode: string[] = []): NotebookDomain {
        return objectPath.get(this.domainTreeCache, domainNode);
    }

    public getChildrenNameOfDomain(domainNode: string[] = []): string[] {
        return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.categories');
    }

    public getNoteBookNames(): string[] {
        // const domain = this.domainCache.get(domainNode[0])
        return [...Object.keys(this.domainTreeCache)]
    }

    public getNotesNumberUnderDomain(domainNode: string[], cnt = 0): number {
        cnt += this.getNotesNumberOfDomain(domainNode)
        const nbDomain = objectPath.get(this.domainTreeCache, domainNode)
        for (const dName of Object.keys(nbDomain).filter(d => d !== '.categories')) {
            return this.getNotesNumberUnderDomain(domainNode.concat(dName), cnt)
        }
        return cnt
    }

    public getNotesNumberOfDomain(domainNode: string[]): number {
        const nb = this.readNotebook(domainNode[0])
        const domain: NotebookDomain = objectPath.get(nb, ['domain', ...domainNode])
        if (domain['.categories']) {
            return Object.values(domain['.categories']).flat().length
        } else {
            return 0
        }
    }

    public updateNoteContent(notebook: string, nId: string, contents: string[]) {
        this.cacheNoteBook(notebook)
        console.log(notebook, nId, contents)
        this.notebookCache.notes[nId].contents = contents
        this.writeNotebook(notebook, this.notebookCache)
        // writeFileSync(this.getNoteBookFile(notebook), yaml.stringify(this.notebookCache), { encoding: 'utf8' })
    }

    // public getNotesOfNoteBook(domainNode: string[]): { [nId: string]: { contents: string[] } } {
    //     return this.notebookCache['notes']
    // }

    public createEditNoteEnv(notebookName: string, nId: string, mode: 'edit' | 'add' | 'del' = 'edit') {
        const note = this.notebookCache.notes[nId]
        vfs.writeFileSync(path.join(this.notesCacheDirectory, `${notebookName}_${nId}.txt`), note.contents.join("\n+=+=+=+=\n"))
        return path.join(this.notesCacheDirectory, `${notebookName}_${nId}.txt`)
    }

    public removeEditNoteEnv(notebookName: string, nId: string) {
        removeSync(path.join(this.notesCacheDirectory, `${notebookName}_${nId}.txt`))
    }

    public checkDocExist(nbName: string, nId: string): boolean {
        return existsSync(path.join(this.masterPath, nbName, `${nId}_doc`, 'README.md')); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public checkFilesExist = (domainNode: string[], nId: string) => existsSync(path.join(this.masterPath, domainNode[0], `${nId}_files`));

    public createCategory(domainNode: string[], cname: string) {
        const dn: NotebookDomain = objectPath.get(this.notebookCache, ['domain', ...domainNode])
        if (dn['.categories'] === undefined) {
            dn['.categories'] = {}
        }
        dn['.categories'][cname] = []
        this.writeNotebook(domainNode[0], this.notebookCache)
    }

    public checkNotesExist(domainNode: string[]) {
        return this.getDomain(domainNode)['.categories'] !== undefined
    }

    public getFilesPath = (domainNode: string[], nId: string) => path.join(this.masterPath, domainNode.join(pathSplit), `${nId}_files`)

    public noteDocCreate(nbName: string, nId: string) {
        const docDir = path.join(this.masterPath, nbName, `${nId}_doc`)
        mkdirpSync(docDir)
        const docMainFile = path.join(docDir, 'README.md')
        vfs.writeFileSync(docMainFile, '')
    }

    public getDocMainFile(nbName: string, nId: string) {
        return path.join(this.masterPath, nbName, `${nId}_doc`, 'README.md')
    }

}

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