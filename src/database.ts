import * as path from 'path'

import * as objectPath from 'object-path'
import {
  existsSync,
  readdirSync,
  mkdirpSync,
  removeSync
} from 'fs-extra'

import { tools, vfs } from './helper'

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

interface NotebookNotes {
    [nId: string]: { contents: string[], cts: number, mts: number }
}

export class NoteBookDatabase {
  private readonly masterPath: string
  // private readonly shortcutsFile: string;
  public nbNotesCache = new Map<string, [NotebookNotes, number]>()
  public domainTreeCache: NotebookDomain = {}
  // public notebookCache: Notebook = { domains: {}, notes: {} };
  public notesCacheDirectory: string
  // private readonly domainCacheName = 'domain.cache.json';
  // private readonly domainCacheFile;
  // public readonly noteDB: NoteDatabase;

  constructor (masterPath: string) {
    this.masterPath = masterPath
    this.notesCacheDirectory = path.join(this.masterPath, '.cache')
    // this.shortcutsFile = path.join(this.vsnoteDbPath, 'shortcuts.json');
    this.initDirectories()
    // this.noteDB = new NoteDatabase(masterPath);
    // this.domainCache = vfs.readJsonSync(this.domainCacheFile);
    const s = (new Date()).getTime()
    this.refresh()
    console.log('refresh domain success. time: ' + `${new Date().getTime() - s}`)
  }

  private initDirectories () {
    if (!existsSync(this.masterPath)) {
      mkdirpSync(this.masterPath)
      existsSync(this.notesCacheDirectory) || mkdirpSync(this.notesCacheDirectory)
      mkdirpSync(this.getNoteBookDirectory('vscode-note'))
      this.createDomain(['vscode-note'])
      this.createCategory(['vscode-note'], 'default')
      tools.writeYamlSync(this.getNBNotesFile('vscode-note'), {})
      const nId = this.addNote(['vscode-note'], 'default')
      this.updateNoteContent('vscode-note', nId, ['hello.'])
    }
  }

  public refresh (nbName: string | undefined = undefined): void {
    if (nbName !== undefined) {
      this.cacheNBDomains(nbName)
    } else {
      this.cacheAllNBDomains()
    }
  }

  public cacheAllNBDomains () {
    for (const nbName of readdirSync(this.masterPath).filter(f => f !== '.cache')) {
      try {
        this.cacheNBDomains(nbName)
      } catch (e) {
        console.error(`nb: ${nbName}. err:${e}`)
      }
    }
  }

  public cacheNBDomains (nbName: string) {
    const domains = this.readNBDomains(nbName)
    objectPath.set(this.domainTreeCache, [nbName], domains)
  }

  public getNBNotes (nbName: string) {
    this.cacheNBNotes(nbName)
    const [notes] = this.nbNotesCache.get(nbName)!
    return notes
  }

  public cacheNBNotes (nbName: string, force = false) {
    const currTime = (new Date()).getTime()
    if (this.nbNotesCache.has(nbName)) {
      const nbNotesCacheTime = this.nbNotesCache.get(nbName)?.[1] || 0
      if (!(force || currTime >= nbNotesCacheTime + 1000 * 60 * 5)) { // 5 mintue
        return
      }
    }
    const nbNotes = this.readNBNotes(nbName)
    this.nbNotesCache.set(nbName, [nbNotes, (new Date()).getTime()])

    // delete redundant notes cache
    if (this.nbNotesCache.size >= 6) {
      const _n1: [string, NotebookNotes, number][] = [...this.nbNotesCache.entries()]
        .map(nb => [nb[0], nb[1][0], nb[1][1]])
      const _nbName = _n1.sort(t => (t as any[])[2])[0][0]
      this.nbNotesCache.delete(_nbName)
    }
  }

  public readNBDomains (nbName: string) {
    return tools.readYamlSync(this.getNBDomainsFile(nbName))
  }

  public readNBNotes (nbName: string) {
    return tools.readYamlSync(this.getNBNotesFile(nbName))
  }

  public writeNBDomains (nbName: string) {
    tools.writeYamlSync(this.getNBDomainsFile(nbName), this.domainTreeCache[nbName])
  }

  public writeNBNotes (nbName: string) {
    tools.writeYamlSync(this.getNBNotesFile(nbName), this.getNBNotes(nbName))
  }

  public getNBDomainsFile = (nbName: string) => path.join(this.masterPath, nbName, 'domains.yaml')

  public getNBNotesFile = (nbName: string) => path.join(this.masterPath, nbName, 'notes.yaml')

  public deleteDomain (domainNode: string[], _withNotes: boolean): void {
    if (domainNode.length === 0) {
      return
    }
    const nbName = domainNode[0]
    objectPath.del(this.domainTreeCache, domainNode)
    this.writeNBDomains(nbName)
  }

  public createDomain (domainNode: string[]) {
    const nbName = domainNode[0]
    objectPath.set(this.domainTreeCache, domainNode, {})
    this.writeNBDomains(nbName)
  }

  public createNotebook (nbName: string) {
    mkdirpSync(this.getNoteBookDirectory(nbName))
    tools.writeYamlSync(this.getNBDomainsFile(nbName), {})
    tools.writeYamlSync(this.getNBNotesFile(nbName), {})
  }

  public removeNote (domainNode: string[], category: string, nId: string, deep = false) {
    const nbName = domainNode[0]
    const nIds = objectPath.get<string[]>(this.domainTreeCache, [...domainNode, '.categories', category], [])
    if (nIds.length >= 1) {
      objectPath.set(this.domainTreeCache, [...domainNode, '.categories', category], nIds.filter(n => n !== nId))
    }
    if (deep) {
      const notes = this.getNBNotes(domainNode[0])
      delete notes[nId]
      this.writeNBNotes(nbName)
      this.removeNoteDoc(domainNode[0], nId)
      this.removeNoteFiles(domainNode[0], nId)
    }
    this.writeNBDomains(nbName)
  }

  public removeNoteDoc (nbName:string, nId:string) {
    removeSync(path.join(this.getNoteBookDirectory(nbName), `${nId}_doc`))
  }

  public removeNoteFiles (nbName:string, nId:string) {
    removeSync(path.join(this.getNoteBookDirectory(nbName), `${nId}_files`))
  }

  public removeCategory (domainNode: string[], cname: string, withNotes: boolean) {
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

  public renameCategory (domainNode: string[], ocname: string, ncname: string) {
    const notesOfCategory = objectPath.get(this.domainTreeCache, [...domainNode, '.categories', ocname], [])
    objectPath.set(this.domainTreeCache, [...domainNode, '.categories', ncname], notesOfCategory)
    objectPath.del(this.domainTreeCache, [...domainNode, '.categories', ocname])
    this.writeNBDomains(domainNode[0])
  }

  public addNote (domainNode: string[], cname: string) {
    // const dNotes = objectPath.get(this.domainTreeCache, [...domainNode, '.categories', cname], [])
    const nbNotes = this.getNBNotes(domainNode[0])
    const nId = generateNId()
    objectPath.push(this.domainTreeCache, [...domainNode, '.categories', cname], nId)
    const ts = (new Date()).getTime()
    nbNotes[nId] = { contents: [''], cts: ts, mts: ts }
    this.writeNBDomains(domainNode[0])
    this.writeNBNotes(domainNode[0])
    return nId
  }

  public getCategoriesOfDomain (domainNode: string[]): any {
    return objectPath.get(this.domainTreeCache, [...domainNode, '.categories'])
  }

  public getNoteBookDirectory = (nbName: string) => path.join(this.masterPath, nbName)

  public getDomain (domainNode: string[] = []): NotebookDomain {
    return objectPath.get(this.domainTreeCache, domainNode)
  }

  public getChildrenNameOfDomain (domainNode: string[] = []): string[] {
    return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.categories')
  }

  public getNoteBookNames (): string[] {
    // const domain = this.domainCache.get(domainNode[0])
    return [...Object.keys(this.domainTreeCache)]
  }

  public getNotesNumberUnderDomain (domainNode: string[], cnt: number = 0): number {
    cnt += this.getNotesNumberOfDomain(domainNode)
    const nbDomain = objectPath.get(this.domainTreeCache, domainNode)
    const domainNames = Object.keys(nbDomain).filter(d => d !== '.categories')
    if (domainNames.length === 0) {
      return cnt
    }

    let _cnt = 0
    for (const d of domainNames) {
      _cnt += this.getNotesNumberUnderDomain(domainNode.concat(d))
    }
    return _cnt
  }

  public getNotesNumberOfDomain (domainNode: string[]): number {
    const categories = objectPath.get(this.domainTreeCache, [...domainNode, '.categories'], {})
    return Object.values(categories).flat().length
  }

  public updateNoteContent (nbName: string, nId: string, contents: string[]) {
    const notes = this.getNBNotes(nbName)
    notes[nId].contents = contents
    notes[nId].mts = (new Date()).getTime()
    this.writeNBNotes(nbName)
  }

  public createEditNoteEnv (notebookName: string, nId: string, _mode: 'edit' | 'add' | 'del' = 'edit') {
    const note = this.getNBNotes(notebookName)[nId]
    vfs.writeFileSync(path.join(this.notesCacheDirectory, `${notebookName}_${nId}.txt`), note.contents.join('\n+=+=+=+=+=\n'))
    return path.join(this.notesCacheDirectory, `${notebookName}_${nId}.txt`)
  }

  public removeEditNoteEnv (notebookName: string, nId: string) {
    removeSync(path.join(this.notesCacheDirectory, `${notebookName}_${nId}.txt`))
  }

  public checkDocExist (nbName: string, nId: string): boolean {
    return existsSync(path.join(this.masterPath, nbName, `${nId}_doc`, 'README.md')) // || existsSync(this.getDocIndexFile(nId, 'README.html'));
  }

  public checkFilesExist (nbName: string, nId: string) {
    return existsSync(path.join(this.masterPath, nbName, `${nId}_files`))
  }

  public createCategory (domainNode: string[], cname: string) {
    objectPath.ensureExists(this.domainTreeCache, [...domainNode, '.categories', cname], [])
    this.writeNBDomains(domainNode[0])
  }

  public checkNotesExist (domainNode: string[]) {
    return objectPath.get(this.domainTreeCache, [...domainNode, '.categories']) !== undefined
  }

  public getFilesPath = (nbName: string, nId: string) => path.join(this.masterPath, nbName, `${nId}_files`)

  public noteDocCreate (nbName: string, nId: string) {
    const docDir = path.join(this.masterPath, nbName, `${nId}_doc`)
    mkdirpSync(docDir)
    const docMainFile = path.join(docDir, 'README.md')
    vfs.writeFileSync(docMainFile, '')
  }

  public noteFilesCreate (nbName: string, nId: string) {
    const filesDir = path.join(this.masterPath, nbName, `${nId}_files`)
    mkdirpSync(filesDir)
  }

  public getDocMainFile (nbName: string, nId: string) {
    return path.join(this.masterPath, nbName, `${nId}_doc`, 'README.md')
  }
}

function generateNId (): string {
  return tools.hexRandom(3)
}

// interface DomainInterface {
//     createDomain(): void
//     deleteDomain(): void
//     renameDomain(): void
// }
