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

export class NBNote implements INBNote {
    filesPath: string;
    docPath: string;
    docMainFile: string;
    constructor(
        private readonly nbDir: string,
        nId: string,
        private readonly note: INBNote
    ) {
        this.filesPath = path.join(this.nbDir, "files", nId);
        this.docPath = path.join(this.nbDir, "doc", nId);
        this.docMainFile = path.join(this.docPath, 'main.md');
    }

    // public update()

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

    public update(content: string[], labels: string[]) {

    }

    public add(labels: string[]) {

    }
}

// export class NBNotesDB {
//     notesdb: { [nId: string]: INBNote };

//     constructor(private readonly notesFilePath: string) {
//         this.notesdb = vfs.readJsonSync(notesFilePath)
//     }

//     update(nId: string, note: INBNote) {
//         vfs.writeJsonSync(this.notesFilePath, this.notesdb);
//     }

//     add(nId: string, note: INBNote) {
//         this.update(nId, note)
//     }

//     delete(nId: string) {
//         delete this.notesdb[nId];
//         vfs.writeJsonSync(this.notesFilePath, this.notesdb);
//     }
// }

class NBNoteCache {

}

export class NBNotes {
    private readonly notesDB: { [nId: string]: INBNote };
    private notesCache = new Map<string, INBNote>();
    private notesGroupedByLabelCache = new Map<string, Set<string>>(); // Set<string>: note ids
    private readonly notesEditCacheDir: string;
    private readonly notesFile: string;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string

    ) {
        this.notesFile = path.join(this.nbDir, 'notes.json');
        existsSync(this.notesFile) || vfs.writeFileSync(this.notesFile, '');

        this.notesEditCacheDir = path.join(this.nbDir, this.nbName, 'cache');
        existsSync(this.notesEditCacheDir) || mkdirpSync(this.notesEditCacheDir);

        this.notesDB = vfs.readJsonSync(this.notesFile);
        this.cacheNotes();
        this.cacheNotesGroupedByLabelCache();
    }

    public cacheNotesGroupedByLabelCache() {
        for (const [nId, note] of Object.entries(this.notesDB)) {
            for (const label of groupLabel2Labels(note.labels)) {
                if (this.notesGroupedByLabelCache.get(label)?.add(nId) === undefined) {
                    this.notesGroupedByLabelCache.set(label, new Set<string>([nId]));
                }
            }
        }
    }

    public cacheNotes() {
        this.notesGroupedByLabelCache.set(this.nbName, new Set<string>());
        for (const [nId, note] of Object.entries(this.notesDB)) {
            // cache note
            this.notesCache.set(nId, note);
            // all note have an nbname label
            this.notesGroupedByLabelCache.get(this.nbName)?.add(nId);
        }
    }

    public addNote(labels: string[]) {
        const nId = tools.generateSixString();
        const ts = (new Date()).getTime();
        const note = { contents: [''], cts: ts, mts: ts, labels: labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName)) }
        this.notesCache.set(nId, note);
        this.permanent()
        return nId;
    }

    public updateNote(nId: string, contents: string[], labels: string[]) {
        const n = this.getNoteByid(nId);
        n.contents = contents.map(c => c.replace('\r\n', '\n').trim());
        n.mts = (new Date()).getTime();
        n.labels = labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName));
        // this.notesDB.update(nId, n)
        this.permanent()
    }

    public removeNote(nId: string) {
        [...this.notesGroupedByLabelCache.values()].forEach(ids => ids.delete(nId))
        this.notesCache.delete(nId);
        this.permanent()
        // this.notesDB.delete(nId);
    }

    public getEditNoteFile(nId: string) {
        return path.join(this.notesEditCacheDir, `${nId}.yaml`);
    }

    public createEditNoteEnv(nId: string) {
        const n = this.getNoteByid(nId);
        const enote = { contents: n.contents, labels: n.labels };
        tools.writeYamlSync(this.getEditNoteFile(nId), enote);
    }

    public removeEditNoteEnv(nId: string) {
        removeSync(this.getEditNoteFile(nId));
    }

    public getDocMainFile(nId: string) {
        return path.join(this.nbDir, 'doc', nId, 'main.md');
    }

    public getNoteByid(nId: string) {
        return this.notesCache.get(nId)!;
    }

    public getNIdsByLabels(labels: string[]): string[] {
        return labels.map(l => [...this.notesGroupedByLabelCache.get(l) || []]).flatMap(i => i);
    }

    public getNotesByLabels(labels: string[]) {
        return this.getNIdsByLabels(labels).map(nId => this.getNoteByid(nId));
    }

    public resetLabels(nId: string, labels: string[]) {
        // this.clearLabels(nId);
        const n = this.getNoteByid(nId);
        n.labels = labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName));
        // this.notesDB.update(nId, n)
        this.permanent()
    }

    public permanent() {
        vfs.writeJsonSync(this.notesFile, Object.fromEntries(this.notesCache.entries()));
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

    // public getLabelsOfNotebook(): string[] {
    //     return [...this.notesLabelsCache.get(nbName)!.keys()];
    // }




    // public getNBLabels(): Map<string, Set<string>> {
    //     this.cacheNotes(nbName);
    //     return this.notesLabelsCache.get(nbName) || new Map();
    // }
}
