import * as path from 'path';

import {
    existsSync,
    mkdirpSync,
    removeSync
} from 'fs-extra';

import { tools, vfs } from '../helper';

export interface NBDomainStruct {
    [domain: string]: NBDomainStruct;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '.labels'?: any; // { [cname:string]: string[] }
}

export interface NBNoteStruct {
    contents: string[];
    cts: number;
    mts: number;
    labels: string[];
}

export class NBNotes {
    private notesCache = new Map<string, NBNoteStruct>();;
    private notesLabelsCache = new Map<string, Set<string>>();
    private editCacheDirectory: string;

    constructor(private readonly nbMasterPath: string, private readonly nbName: string) {
        this.editCacheDirectory = this.getEditCacheDirectory();
        existsSync(this.editCacheDirectory) || mkdirpSync(this.editCacheDirectory);

        this.setCache();
    }

    // public getLabelsOfNotebook(): string[] {
    //     return [...this.notesLabelsCache.get(nbName)!.keys()];
    // }

    public getEditCacheDirectory() {
        return path.join(this.nbMasterPath, this.nbName, 'cache');
    }

    public removeNote(nId: string) {
        this.notesCache.delete(nId);
        this.permanent();
    }

    public removeNoteDoc(nId: string) {
        removeSync(path.join(this.getNotesDirectory(), 'doc', `${nId}`));
    }

    // public getNBLabels(): Map<string, Set<string>> {
    //     this.cacheNotes(nbName);
    //     return this.notesLabelsCache.get(nbName) || new Map();
    // }

    public permanent() {
        vfs.writeJsonSync(this.getNotesFile(), Object.fromEntries(this.notesCache.entries()));
    }

    public getNotesDirectory() {
        return path.join(this.nbMasterPath, this.nbName);
    }

    public setCache() {
        for (const [nId, note] of Object.entries(this.loadNotes())) {
            // cache notes file
            this.notesCache.set(nId, note);

            // cache nid by labels
            for (const label of note.labels) {
                if (this.notesLabelsCache.get(label)?.add(nId) === undefined) {
                    this.notesLabelsCache.set(label, new Set<string>([nId]));
                }
            }
        }
    }

    public updateNote(nId: string, contents: string[], labels: string[]) {
        const n = this.getNoteByid(nId);
        n.contents = contents.map(c => c.replace('\r\n', '\n').trim());
        n.mts = (new Date()).getTime();
        n.labels = labels;
        this.permanent();
    }

    public createEditNoteEnv(nId: string) {
        const n = this.getNoteByid(nId);
        const enote = { contents: n.contents, labels: n.labels };
        tools.writeYamlSync(this.getEditNoteFile(nId), enote);
    }

    public getEditNoteFile(nId: string) {
        return path.join(this.editCacheDirectory, `${nId}.yaml`);
    }

    public removeEditNoteEnv(nId: string) {
        removeSync(this.getEditNoteFile(nId));
    }

    public checkDocExist(nId: string): boolean {
        return existsSync(path.join(this.nbMasterPath, this.nbName, 'doc', `${nId}`, 'README.md')); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public checkFilesExist(nId: string) {
        return existsSync(path.join(this.nbMasterPath, this.nbName, 'files', `${nId}`));
    }

    public getFilesPath = (nId: string) => path.join(this.nbMasterPath, this.nbName, "files", `${nId}`);

    public addDoc(nId: string) {
        const docDir = path.join(this.nbMasterPath, this.nbName, 'doc', nId);
        mkdirpSync(docDir);
        const docMainFile = path.join(docDir, 'README.md');
        vfs.writeFileSync(docMainFile, '');
    }

    public addFiles(nId: string) {
        const filesDir = path.join(this.nbMasterPath, this.nbName, `${nId}_files`);
        mkdirpSync(filesDir);
    }

    public getDocMainFile(nId: string) {
        return path.join(this.nbMasterPath, this.nbName, 'doc', nId, 'README.md');
    }

    public getNoteByid(nId: string) {
        return this.notesCache.get(nId)!;
    }

    public getNIdsByLabels(labels: string[]) {
        return labels.map(l => [...this.notesLabelsCache.get(l) || []]).flatMap(i => i);
    }

    public getNotesByLabels(labels: string[]) {
        return this.getNIdsByLabels(labels).map(nId => this.getNoteByid(nId));
    }

    public loadNotes(): { [nId: string]: NBNoteStruct } {
        return vfs.readJsonSync(this.getNotesFile());
    }

    public getNotesFile() {
        return path.join(this.nbMasterPath, this.nbName, 'notes.json');
    }

    public removeFilesOfNote(nId: string) {
        removeSync(path.join(this.getNotesDirectory(), 'files', `${nId}`));
    }

    public addNote(labels: string[]) {
        // const dNotes = objectPath.get(this.domainTreeCache, [...domainNode, '.categories', cname], [])
        const nId = generateNId();
        // objectPath.push(this.domainTreeCache, [...domainNode, '.categories', cname], nId);
        const ts = (new Date()).getTime();
        this.notesCache.set(nId, { contents: [''], cts: ts, mts: ts, labels: labels });
        // this.writeNBDomains(domainNode[0]);
        this.permanent();
        return nId;
    }

    public resetLabels(nId: string, labels: string[]) {
        this.clearLabels(nId);
        this.addLabels(nId, labels);
    }

    public removeLabel(nId: string, labels: string[]) {
        const n = this.getNoteByid(nId);
        n.labels = n.labels.filter(l => !labels.includes(l));
        this.permanent();
    }

    public clearLabels(nId: string) {
        const n = this.getNoteByid(nId);
        n.labels = [];
        this.permanent();
    }

    public addLabels(nId: string, labels: string[]) {
        const n = this.getNoteByid(nId);
        n.labels = labels;
        this.permanent();
    }
}

function generateNId(): string {
    return tools.hexRandom(3);
}