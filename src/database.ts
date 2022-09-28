import * as path from 'path';

import * as objectPath from 'object-path';
import {
  existsSync,
  readdirSync,
  mkdirpSync,
  removeSync
} from 'fs-extra';

import { tools, vfs } from './helper';

export interface NotebookDomain {
  [domain: string]: NotebookDomain;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '.labels'?: any; // { [cname:string]: string[] }
}

// export interface NotebookNote {
//   nId: string;
//   cIdx: number;
//   nIdx: number;
//   category: string;
//   contents: string[];
//   isFiles: boolean;
//   isDoc: boolean;
// }

interface NotebookNotes {
  [nId: string]: INote
}

interface INote {
  contents: string[], cts: number, mts: number, labels: string[]
}

interface PostNote {
  contents: string[];
  cts: number;
  mts: number;
  labels: string[];
  doc: boolean;
  files: boolean
}

// export type NoteBook = string;

export class NoteBookDatabase {
  private readonly masterPath: string;
  public nbNotesCache = new Map<string, [NotebookNotes, number]>();
  public nbNotesLabelsCache = new Map<string, Map<string, Set<string>>>();
  public domainTreeCache: NotebookDomain = {};
  // public notebookCache: Notebook = { domains: {}, notes: {} };
  // public notesCacheDirectory: string;
  // private readonly domainCacheName = 'domain.cache.json';
  // private readonly domainCacheFile;
  // public readonly noteDB: NoteDatabase;

  constructor(masterPath: string) {
    this.masterPath = masterPath;
    // this.notesCacheDirectory = path.join(this.masterPath, '.cache');
    // this.shortcutsFile = path.join(this.vsnoteDbPath, 'shortcuts.json');
    this.initDirectories();
    // this.noteDB = new NoteDatabase(masterPath);
    // this.domainCache = vfs.readJsonSync(this.domainCacheFile);
    const s = (new Date()).getTime();
    this.refresh();
    console.log('refresh domain success. time: ' + `${new Date().getTime() - s}`);
  }

  public getNoteBookCacheDirectory(nbName: string) {
    return path.join(this.masterPath, nbName, 'cache');
  }

  private initDirectories() {
    if (!existsSync(this.masterPath)) {
      mkdirpSync(this.masterPath);
      // existsSync(this.notesCacheDirectory) || mkdirpSync(this.notesCacheDirectory);
      mkdirpSync(this.getNoteBookDirectory('vscode-note'));
      this.createDomain(['vscode-note']);
      // this.createCategory(['vscode-note'], 'default', []);
      // tools.writeYamlSync(this.getNBNotesFile('vscode-note'), {});
      // const nId = this.addNote(['vscode-note'], 'default');
      // this.updateNoteContents('vscode-note', nId, ['hello.']);
    }
  }

  public refresh(nbName: string | undefined = undefined): void {
    if (nbName !== undefined) {
      this.cacheNBDomains(nbName);
    } else {
      this.cacheAllNBDomains();
    }
  }

  private createNBCacheDirectory(nbName: string) {
    mkdirpSync(this.getNoteBookCacheDirectory(nbName));
  }

  public cacheAllNBDomains() {
    for (const nbName of readdirSync(this.masterPath).filter(f => f !== '.cache')) {
      try {
        this.cacheNBDomains(nbName);
      } catch (e) {
        console.error(`nb: ${nbName}. err:${e}`);
      }
    }
  }

  public cacheNBDomains(nbName: string) {
    const domains = this.readNBDomains(nbName);
    objectPath.set(this.domainTreeCache, [nbName], domains);
  }

  public getNBNotes(nbName: string) {
    this.cacheNBNotes(nbName);
    const [notes] = this.nbNotesCache.get(nbName)!;
    // update nbnotes pin time.
    this.nbNotesCache.set(nbName, [notes, (new Date()).getTime()]);
    return notes;
  }

  public getNBLabels(nbName: string): Map<string, Set<string>> {
    this.cacheNBNotes(nbName);
    return this.nbNotesLabelsCache.get(nbName) || new Map();
  }

  public cacheNBNotes(nbName: string, force = false) {
    const currTime = (new Date()).getTime();
    if (this.nbNotesCache.has(nbName)) {
      const nbNotesCacheTime = this.nbNotesCache.get(nbName)?.[1] || 0;
      if (!(force || currTime >= nbNotesCacheTime + 1000 * 60 * 5)) { // 5 mintue
        return;
      }
    }
    const nbNotes = this.readNBNotes(nbName);
    this.nbNotesCache.set(nbName, [nbNotes, (new Date()).getTime()]);

    // delete redundant notes cache
    if (this.nbNotesCache.size >= 6) {
      const _n1: [string, NotebookNotes, number][] = [...this.nbNotesCache.entries()]
        .map(nb => [nb[0], nb[1][0], nb[1][1]]);
      const _nbName = _n1.sort(t => (t as any[])[2])[0][0];
      this.nbNotesCache.delete(_nbName);
    }
  }

  public cacheNBNotesByLables(nbName: string) {
    const _cache = new Map<string, Set<string>>();
    const nbNotesCache = this.nbNotesCache.get(nbName)?.[0] || {};
    for (const [nId, note] of Object.entries(nbNotesCache)) {
      for (const label of note.labels) {
        if (_cache.get(label)?.add(nId) === undefined) {
          _cache.set(label, new Set<string>([nId]));
        }
      }
    }
    this.nbNotesLabelsCache.set(nbName, _cache);
  }

  public readNBDomains(nbName: string) {
    return vfs.readJsonSync(this.getNBDomainsFile(nbName));
  }

  public readNBNotes(nbName: string): any {
    return vfs.readJsonSync(this.getNBNotesFile(nbName));
  }

  public writeNBDomains(nbName: string) {
    vfs.writeJsonSync(this.getNBDomainsFile(nbName), this.domainTreeCache[nbName]);
  }

  public permanentNBNotes(nbName: string) {
    vfs.writeJsonSync(this.getNBNotesFile(nbName), this.getNBNotes(nbName));
  }

  public getNBDomainsFile = (nbName: string) => path.join(this.masterPath, nbName, 'domains.json');

  public getNBNotesFile = (nbName: string) => path.join(this.masterPath, nbName, 'notes.json');

  public deleteDomain(domainNode: string[]): void {
    if (domainNode.length === 0) {
      return;
    }
    const nbName = domainNode[0];
    objectPath.del(this.domainTreeCache, domainNode);
    this.writeNBDomains(nbName);
  }

  public moveDomain(orgDomainNode: string[], newDomainNode: string[]) {
    const domain = this.getDomain(orgDomainNode);
    this.deleteDomain(orgDomainNode);
    objectPath.set(this.domainTreeCache, newDomainNode, domain);
  }

  public renameDomain(domainNode: string[], domainName: string) {
    const _d = [...domainNode];
    _d[domainNode.length - 1] = domainName;
    const domain = this.getDomain(domainNode);
    this.deleteDomain(domainNode);
    objectPath.set(this.domainTreeCache, _d, domain);
    this.writeNBDomains(domainNode[0]);
  }

  public createDomain(domainNode: string[]) {
    const nbName = domainNode[0];
    objectPath.set(this.domainTreeCache, domainNode, {});
    this.writeNBDomains(nbName);
  }

  public createNotebook(nbName: string) {
    mkdirpSync(this.getNoteBookDirectory(nbName));
    vfs.writeJsonSync(this.getNBDomainsFile(nbName), {});
    vfs.writeJsonSync(this.getNBNotesFile(nbName), {});
  }

  public removeNote(nbName: string, nId: string) {
    const notes = this.getNBNotes(nbName);
    delete notes[nId];
    this.permanentNBNotes(nbName);
  }

  public removeNoteDoc(nbName: string, nId: string) {
    removeSync(path.join(this.getNoteBookDirectory(nbName), 'doc', `${nId}`));
  }

  public removeNoteFiles(nbName: string, nId: string) {
    removeSync(path.join(this.getNoteBookDirectory(nbName), 'files', `${nId}`));
  }

  public addNote(domainNode: string[], labels: string[]) {
    // const dNotes = objectPath.get(this.domainTreeCache, [...domainNode, '.categories', cname], [])
    const nbNotes = this.getNBNotes(domainNode[0]);
    const nId = generateNId();
    // objectPath.push(this.domainTreeCache, [...domainNode, '.categories', cname], nId);
    const ts = (new Date()).getTime();
    nbNotes[nId] = { contents: [''], cts: ts, mts: ts, labels: [...(new Set(domainNode.slice(1).concat(labels))).values()] };
    // this.writeNBDomains(domainNode[0]);
    this.permanentNBNotes(domainNode[0]);
    return nId;
  }

  public getLabelsOfNotebook(nbName: string): string[] {
    return [...this.nbNotesLabelsCache.get(nbName)!.keys()];
  }

  public getLabelsOfDomain(domainNode: string[]): string[] {
    return objectPath.get(this.domainTreeCache, [...domainNode, '.labels']);
  }

  public getNoteBookDirectory = (nbName: string) => path.join(this.masterPath, nbName);

  public getDomain(domainNode: string[] = []): NotebookDomain {
    return objectPath.get(this.domainTreeCache, domainNode);
  }

  public getChildrenNameOfDomain(domainNode: string[] = []): string[] {
    return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.labels');
  }

  public getNoteBookNames(): string[] {
    // const domain = this.domainCache.get(domainNode[0])
    return [...Object.keys(this.domainTreeCache)];
  }

  public getNotesNumberUnderDomain(domainNode: string[], cnt: number = 0): number {
    cnt += this.getNotesNumberOfDomain(domainNode);
    const nbDomain = objectPath.get(this.domainTreeCache, domainNode);
    const domainNames = Object.keys(nbDomain).filter(d => d !== '.labels');
    if (domainNames.length === 0) {
      return cnt;
    }

    let _cnt = 0;
    for (const d of domainNames) {
      _cnt += this.getNotesNumberUnderDomain(domainNode.concat(d));
    }
    return _cnt;
  }

  public getNotesNumberOfDomain(domainNode: string[]): number {
    const categories = objectPath.get(this.domainTreeCache, [...domainNode, '.labels'], {});
    return Object.values(categories).flat().length;
  }

  public updateNote(nbName: string, nId: string, contents: string[], labels: string[]) {
    const notes = this.getNBNotes(nbName);
    notes[nId].contents = contents.map(c => c.replace('\r\n', '\n').trim());
    notes[nId].mts = (new Date()).getTime();
    notes[nId].labels = labels;
    this.permanentNBNotes(nbName);
  }

  public createEditNoteEnv(nbName: string, nId: string) {
    this.createNBCacheDirectory(nbName);
    const n = this.getNBNotes(nbName)[nId];
    const enote = { contents: n.contents, labels: n.labels };
    const noteYamlFile = path.join(this.getNoteBookCacheDirectory(nbName), `${nId}.yaml`);
    tools.writeYamlSync(noteYamlFile, enote);
    return noteYamlFile;
  }

  public removeEditNoteEnv(nbName: string, nId: string) {
    removeSync(path.join(this.getNoteBookCacheDirectory(nbName), `${nId}.yaml`));
  }

  public checkDocExist(nbName: string, nId: string): boolean {
    return existsSync(path.join(this.masterPath, nbName, 'doc', `${nId}`, 'README.md')); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
  }

  public checkFilesExist(nbName: string, nId: string) {
    return existsSync(path.join(this.masterPath, nbName, 'files', `${nId}`));
  }

  // public createCategory(domainNode: string[], cname: string, labels: string[]) {
  //   objectPath.ensureExists(this.domainTreeCache, [...domainNode, '.categories', cname], labels);
  //   this.writeNBDomains(domainNode[0]);
  // }

  public checkLabelsExist(domainNode: string[]) {
    return objectPath.get(this.domainTreeCache, [...domainNode, '.labels'], []).length !== 0;
  }

  public getFilesPath = (nbName: string, nId: string) => path.join(this.masterPath, nbName, "files", `${nId}`);

  public noteDocCreate(nbName: string, nId: string) {
    const docDir = path.join(this.masterPath, nbName, 'doc', nId);
    mkdirpSync(docDir);
    const docMainFile = path.join(docDir, 'README.md');
    vfs.writeFileSync(docMainFile, '');
  }

  public noteFilesCreate(nbName: string, nId: string) {
    const filesDir = path.join(this.masterPath, nbName, `${nId}_files`);
    mkdirpSync(filesDir);
  }

  public getDocMainFile(nbName: string, nId: string) {
    return path.join(this.masterPath, nbName, 'doc', nId, 'README.md');
  }

  public getNoteByid(nbName: string, nId: string) {
    return this.getNBNotes(nbName)[nId];
  }

  public getNotesByLabels(nbName: string, labels: string[]): any[] {
    const nIds = labels
      .map(l => { return Array.from(this.nbNotesLabelsCache.get(nbName)?.get(l)?.values() || []); })
      .reduce((p, c) => tools.intersections(p, c),
        Array.from(this.nbNotesLabelsCache.get(nbName)?.get(labels[0])?.values() || [])
      );
    return nIds.map(nId => {
      const note = this.nbNotesCache.get(nbName)![0][nId] as any;
      note['nId'] = nId;
      note['doc'] = this.checkDocExist(nbName, nId);
      note['files'] = this.checkFilesExist(nbName, nId);
      return note;
    });
  }

  public getNotesOfDomain(domainNode: string[]): PostNote[] {
    const nbName = domainNode[0];
    const labels = this.getLabelsOfDomain(domainNode);
    const nIds = labels
      .map(l => { return Array.from(this.nbNotesLabelsCache.get(nbName)?.get(l)?.values() || []); })
      .reduce((p, c) => tools.intersections(p, c),
        Array.from(this.nbNotesLabelsCache.get(nbName)?.get(labels[0])?.values() || [])
      );
    return nIds.map(nId => {
      const note = this.nbNotesCache.get(nbName)![0][nId] as any;
      note['nId'] = nId;
      note['doc'] = this.checkDocExist(nbName, nId);
      note['files'] = this.checkFilesExist(nbName, nId);
      return note;
    });

  }

  public labelDomain(domainNode: string[], labels: string[]) {
    objectPath.set(this.domainTreeCache, [...domainNode, '.labels'], labels);
    this.writeNBDomains(domainNode[0]);
  }

  public domainRelabels(domainNode: string[], labels: string[]) {
    objectPath.set(this.domainTreeCache, [...domainNode, '.labels'], labels);
    this.writeNBDomains(domainNode[0]);
  }
}

function generateNId(): string {
  return tools.hexRandom(3);
}

// interface DomainInterface {
//     createDomain(): void
//     deleteDomain(): void
//     renameDomain(): void
// }
