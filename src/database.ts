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
    domains: NotebookDomain
    notes: { [id: string]: { contents: string[] } }
}

interface NotebookNotes {
    [nId: string]: { contents: string[] }
}

export class NoteBookDatabase {
    private readonly masterPath: string;
    // private readonly shortcutsFile: string;
    public nbNotesCache = new Map<string, [NotebookNotes, number]>();
    public domainTreeCache: NotebookDomain = {};
    // public notebookCache: Notebook = { domains: {}, notes: {} };
    public notesCacheDirectory: string;
    // private readonly domainCacheName = 'domain.cache.json';
    // private readonly domainCacheFile;
    // public readonly noteDB: NoteDatabase;

    constructor(masterPath: string) {
        this.masterPath = masterPath;
        this.notesCacheDirectory = path.join(this.masterPath, '.cache')
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

    public refresh(nbName: string | undefined = undefined): void {
        if (nbName !== undefined) {
            this.cacheNBDomains(nbName)
        } else {
            this.cacheAllNBDomains();
        }
    }

    public cacheAllNBDomains() {
        for (const nbName of readdirSync(this.masterPath).filter(f => f !== '.cache')) {
            try {
                this.cacheNBDomains(nbName)
            } catch (e) {
                console.error(`nb: ${nbName}. err:${e}`)
            }
        }
    }

    public cacheNBDomains(nbName: string) {
        const domains = this.readNBDomains(nbName)
        objectPath.set(this.domainTreeCache, [nbName], domains)
    }

    public getNBNotes(nbName: string) {
        this.cacheNBNotes(nbName)
        const [notes, _ts] = this.nbNotesCache.get(nbName)!
        this.nbNotesCache.set(nbName, [notes, (new Date()).getTime()])
        return notes
    }

    public cacheNBNotes(nbName: string, force = false) {
        const currTime = (new Date()).getTime()
        if (this.nbNotesCache.has(nbName)) {
            const nbNotesCacheTime = this.nbNotesCache.get(nbName)?.[1] || 0
            if (!(force || currTime >= nbNotesCacheTime + 1000 * 60 * 5)) {// 5 mintue
                return
            }
        }
        const nbNotes = this.readNBNotes(nbName)
        this.nbNotesCache.set(nbName, [nbNotes, (new Date()).getTime()]);

        // delete redundant notes cache 
        if (this.nbNotesCache.size >= 6) {
            const _n1: [string, NotebookNotes, number][] = [...this.nbNotesCache.entries()]
                .map(nb => [nb[0], nb[1][0], nb[1][1]])
            const _nbName = _n1.sort(t => (t as any[])[2])[0][0]
            this.nbNotesCache.delete(_nbName)
        }
        console.log('nbNotesCache size', this.nbNotesCache.size, JSON.stringify([...this.nbNotesCache.keys()]))
    }

    public readNBDomains(nbName: string) {
        return tools.readYamlSync(this.getNBDomainsFile(nbName))
    }

    public readNBNotes(nbName: string) {
        return tools.readYamlSync(this.getNBNotesFile(nbName))
    }

    public writeNBDomains(nbName: string) {
        tools.writeYamlSync(this.getNBDomainsFile(nbName), this.domainTreeCache[nbName])
    }

    public writeNBNotes(nbName: string) {
        tools.writeYamlSync(this.getNBNotesFile(nbName), this.getNBNotes(nbName))
    }

    public getNBDomainsFile = (nbName: string) => path.join(this.masterPath, nbName, `domains.yaml`)

    public getNBNotesFile = (nbName: string) => path.join(this.masterPath, nbName, `notes.yaml`)

    public deleteDomain(domainNode: string[], withNotes: boolean): void {
        if (domainNode.length === 0) {
            return
        }
        const nbName = domainNode[0]
        objectPath.del(this.domainTreeCache, domainNode);
        this.writeNBDomains(nbName)
    }

    public createDomain(domainNode: string[]) {
        const nbName = domainNode[0]
        objectPath.set(this.domainTreeCache, domainNode, {})
        this.writeNBDomains(nbName)
    }

    public removeNote(domainNode: string[], category: string, nId: string, deep = false) {
        const nbName = domainNode[0]
        const nIds = objectPath.get<string[]>(this.domainTreeCache, [...domainNode, '.categories', category], [])
        if (nIds.length >= 1) {
            objectPath.set(this.domainTreeCache, [...domainNode, '.categories', category], nIds.filter(n => n !== nId))
        }
        if (deep) {
            const notes = this.readNBNotes(domainNode[0])
            delete notes[nId]
            this.writeNBNotes(nbName)
        }
        this.writeNBDomains(nbName)
    }

    public removeCategory(domainNode: string[], cname: string, withNotes: boolean) {
        const notesOfCategory = objectPath.get(this.domainTreeCache, [...domainNode, '.categories', cname], [])
        if (withNotes) {
            const nbNotes = this.getNBNotes(domainNode[0])
            for (const nId of notesOfCategory) {
                delete nbNotes[nId]
            }
            this.writeNBNotes(domainNode[0])
        }
        objectPath.del(this.domainTreeCache, [...domainNode, '.categories', cname])
        if (Object.keys(objectPath.get(this.domainTreeCache, [...domainNode, '.categories'])).length === 0) {
            objectPath.del(this.domainTreeCache, [...domainNode, '.categories'])
        }
        this.writeNBDomains(domainNode[0])
    }

    public renameCategory(domainNode: string[], ocname: string, ncname: string) {
        const notesOfCategory = objectPath.get(this.domainTreeCache, [...domainNode, '.categories', ocname], [])
        objectPath.set(this.domainTreeCache, [...domainNode, '.categories', ncname], notesOfCategory)
        objectPath.del(this.domainTreeCache, [...domainNode, '.categories', ocname])
        this.writeNBDomains(domainNode[0])
    }

    public addNote(domainNode: string[], cname: string) {
        // const dNotes = objectPath.get(this.domainTreeCache, [...domainNode, '.categories', cname], [])
        const nbNotes = this.getNBNotes(domainNode[0])
        const nId = generateNId()
        objectPath.push(this.domainTreeCache, [...domainNode, '.categories', cname], nId)
        nbNotes[nId] = { contents: [''] }
        this.writeNBDomains(domainNode[0])
        this.writeNBNotes(domainNode[0])
        return nId
    }

    public getCategoriesOfDomain(domainNode: string[]): any {
        return objectPath.get(this.domainTreeCache, [...domainNode, '.categories'])
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
        // const nb = this.readNBDomains(domainNode[0])
        const domain: NotebookDomain = objectPath.get(this.domainTreeCache, domainNode)
        if (domain['.categories']) {
            return Object.values(domain['.categories']).flat().length
        } else {
            return 0
        }
    }

    public updateNoteContent(nbName: string, nId: string, contents: string[]) {
        const notes = this.getNBNotes(nbName)
        notes[nId].contents = contents
        this.writeNBNotes(nbName)
    }

    // public getNotesOfNoteBook(domainNode: string[]): { [nId: string]: { contents: string[] } } {
    //     return this.notebookCache['notes']
    // }

    public createEditNoteEnv(notebookName: string, nId: string, mode: 'edit' | 'add' | 'del' = 'edit') {
        const note = this.getNBNotes(notebookName)[nId]
        vfs.writeFileSync(path.join(this.notesCacheDirectory, `${notebookName}_${nId}.txt`), note.contents.join("\n+=+=+=+=\n"))
        return path.join(this.notesCacheDirectory, `${notebookName}_${nId}.txt`)
    }

    public removeEditNoteEnv(notebookName: string, nId: string) {
        removeSync(path.join(this.notesCacheDirectory, `${notebookName}_${nId}.txt`))
    }

    public checkDocExist(nbName: string, nId: string): boolean {
        return existsSync(path.join(this.masterPath, nbName, `${nId}_doc`, 'README.md')); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public checkFilesExist(nbName: string, nId: string) {
        return existsSync(path.join(this.masterPath, nbName, `${nId}_files`));
    }

    public createCategory(domainNode: string[], cname: string) {
        objectPath.ensureExists(this.domainTreeCache, [...domainNode, '.categories', cname], [])
        this.writeNBDomains(domainNode[0])
    }

    public checkNotesExist(domainNode: string[]) {
        return this.getDomain(domainNode)['.categories'] !== undefined
    }

    public getFilesPath = (nbName: string, nId: string) => path.join(this.masterPath, nbName, `${nId}_files`)

    public noteDocCreate(nbName: string, nId: string) {
        const docDir = path.join(this.masterPath, nbName, `${nId}_doc`)
        mkdirpSync(docDir)
        const docMainFile = path.join(docDir, 'README.md')
        vfs.writeFileSync(docMainFile, '')
    }

    public noteFilesCreate(nbName: string, nId: string) {
        console.log("fff", nbName)
        const filesDir = path.join(this.masterPath, nbName, `${nId}_files`)
        mkdirpSync(filesDir)
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