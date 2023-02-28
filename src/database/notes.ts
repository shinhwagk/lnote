import * as path from 'path';

import {
    existsSync,
    mkdirpSync,
    readJSONSync,
    removeSync
} from 'fs-extra';

import { tools, vfs } from '../helper';

// export interface NBDomainStruct {
//     [domain: string]: NBDomainStruct;
//     // eslint-disable-next-line @typescript-eslint/naming-convention
//     '.labels'?: any; // { [cname:string]: string[] }
// }

export interface INBNote {
    contents: string[];
    cts: number;
    mts: number;
    labels: { [gl: string]: string[] }; // label group
}

function labels2GroupLabel(labels: string[]) {
    const gl: { [g: string]: string[] } = {}
    for (const label of labels) {
        const [g, l] = label.split('->');
        if (g in gl) {
            gl[g].push(l)
        } else {
            gl[g] = [l]
        }
    }
    return gl
}

function groupLabel2Labels(groupLabels: { [gl: string]: string[] }) {
    const labels = []
    for (const gl of Object.keys(groupLabels)) {
        for (const l of groupLabels[gl]) {
            const n_label = `${gl}->${l}`
            labels.push(n_label)
        }
    }
    return labels
}

export class NBNote {
    filesPath: string;
    docPath: string;
    docMainFile: string;
    constructor(private readonly nbDir: string, private readonly nId: string, private readonly note: INBNote) {
        this.filesPath = path.join(this.nbDir, "files", `${nId}`);
        this.docPath = path.join(this.nbDir, "doc", `${nId}`);
        this.docMainFile = path.join(this.docPath, 'main.md');
    }

    public removeDoc() {
        removeSync(this.docPath);
    }

    public removeFiles() {
        removeSync(this.filesPath);
    }

    public checkDocExist(): boolean {
        return existsSync(this.docMainFile); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public checkFilesExist() {
        return existsSync(this.filesPath);
    }

    public addDoc() {
        mkdirpSync(this.docPath);
        vfs.writeFileSync(this.docMainFile, '');
    }

    public addFiles() {
        mkdirpSync(this.filesPath);
    }
}

export class NBNotesDBFile {
    private notes: { [nId: string]: INBNote };

    constructor(private readonly notesFilePath: string) {
        this.notes = readJSONSync(notesFilePath)
    }

    flash() {
        this.notes = readJSONSync(this.notesFilePath)
    }

    get() {
        return this.notes
    }

    update(nId: string, note: INBNote) {
        this.flash()
        this.notes[nId] = note
        vfs.writeJsonSync(this.notesFilePath, this.notes);
    }

    add(nId: string, note: INBNote) {
        this.flash()
        this.update(nId, note)
    }

    delete(nId: string) {
        this.flash();
        delete this.notes[nId];
        vfs.writeJsonSync(this.notesFilePath, this.notes);
    }
}

class NBNoteCache {

}

export class NBNotes {
    private notesDBFile;
    private notesCache = new Map<string, INBNote>();
    private notesLabelsCache = new Map<string, Set<string>>();
    private editCacheDirectory: string;

    constructor(private readonly nbMasterPath: string, private readonly nbName: string) {
        this.editCacheDirectory = this.getEditCacheDirectory();
        existsSync(this.editCacheDirectory) || mkdirpSync(this.editCacheDirectory);

        if (!existsSync(this.getNotesFile())) {
            // mkdirpSync(this.getNotesFile())
        }
        this.notesDBFile = new NBNotesDBFile(this.getNotesFile())
        this.cacheNotes();
        this.cacheNotesByLabels();
    }

    // public getLabelsOfNotebook(): string[] {
    //     return [...this.notesLabelsCache.get(nbName)!.keys()];
    // }

    public getEditCacheDirectory() {
        return path.join(this.nbMasterPath, this.nbName, 'cache');
    }

    public removeNote(nId: string) {
        for (const label of this.notesLabelsCache.keys()) {
            this.notesLabelsCache.get(label)?.delete(nId);
        }
        this.notesLabelsCache.get(this.nbName)?.delete(nId);
        this.notesCache.delete(nId);
        this.notesDBFile.delete(nId);
    }



    // public getNBLabels(): Map<string, Set<string>> {
    //     this.cacheNotes(nbName);
    //     return this.notesLabelsCache.get(nbName) || new Map();
    // }

    public cacheNotesByLabels() {
        for (const [nId, note] of Object.entries(this.notesDBFile.get())) {
            for (const label of groupLabel2Labels(note.labels)) {
                if (this.notesLabelsCache.get(label)?.add(nId) === undefined) {
                    this.notesLabelsCache.set(label, new Set<string>([nId]));
                }
            }
        }
    }

    public cacheNotes() {
        this.notesLabelsCache.set(this.nbName, new Set<string>());
        for (const [nId, note] of Object.entries(this.notesDBFile.get())) {
            // cache notes file
            this.notesCache.set(nId, note);

            // all note have an nbname label
            this.notesLabelsCache.get(this.nbName)?.add(nId);
            // cache nid by labels
        }

    }

    public updateNote(nId: string, contents: string[], labels: string[]) {
        const n = this.getNoteByid(nId);
        n.contents = contents.map(c => c.replace('\r\n', '\n').trim());
        n.mts = (new Date()).getTime();
        n.labels = labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName));
        this.notesDBFile.update(nId, n)
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



    public getDocMainFile(nId: string) {
        return path.join(this.nbMasterPath, this.nbName, 'doc', nId, 'main.md');
    }

    public getNoteByid(nId: string) {
        return this.notesCache.get(nId)!;
    }

    public getNIdsByLabels(labels: string[]): string[] {
        return labels.map(l => [...this.notesLabelsCache.get(l) || []]).flatMap(i => i);
    }

    public getNotesByLabels(labels: string[]) {
        return this.getNIdsByLabels(labels).map(nId => this.getNoteByid(nId));
    }

    // public loadNotes(): { [nId: string]: INBNote } {
    //     return vfs.readJsonSync(this.getNotesFile());
    // }

    public getNotesFile() {
        return path.join(this.nbMasterPath, this.nbName, 'notes.json');
    }



    public addNote(labels: string[]) {
        // const dNotes = objectPath.get(this.domainTreeCache, [...domainNode, '.categories', cname], [])
        const nId = generateNId();
        // objectPath.push(this.domainTreeCache, [...domainNode, '.categories', cname], nId);
        const ts = (new Date()).getTime();
        const note = { contents: [''], cts: ts, mts: ts, labels: labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName)) }
        this.notesCache.set(nId, note);
        // this.writeNBDomains(domainNode[0]);
        this.notesDBFile.add(nId, note)
        return nId;
    }

    public resetLabels(nId: string, labels: string[]) {
        // this.clearLabels(nId);
        const n = this.getNoteByid(nId);
        n.labels = labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName));
        this.notesDBFile.update(nId, n)
    }

    // public removeLabel(nId: string, labels: string[]) {
    //     const n = this.getNoteByid(nId);
    //     n.labels = n.labels.filter(l => !labels.includes(l));
    //     n.labels = tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName);
    //     this.permanent();
    // }

    // public clearLabels(nId: string) {
    //     const n = this.getNoteByid(nId);
    //     n.labels = [];
    //     this.permanent();
    // }

    // public addLabels(nId: string, labels: string[]) {
    //     const n = this.getNoteByid(nId);
    //     n.labels = tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName);
    //     this.permanent();
    // }
}

function generateNId(): string {
    return tools.hexRandom(3);
}