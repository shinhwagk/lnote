import * as path from 'path';

import {
    existsSync,
    mkdirpSync,
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

export class NBNote {
    filesPath: string;
    docPath: string;
    constructor(private readonly nbDir: string, private readonly nId: string, private readonly note: INBNote) {
        this.filesPath = path.join(this.nbDir, "files", `${nId}`);
        this.docPath = path.join(this.nbDir, "doc", `${nId}`);
    }

    public removeDoc() {
        removeSync(this.docPath);
    }

    public removeFiles() {
        removeSync(this.filesPath);
    }

    public checkDocExist(): boolean {
        return existsSync(path.join(this.docPath, 'README.md')); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public checkFilesExist() {
        return existsSync(this.filesPath);
    }
}

export class NBNotes {
    private notesCache = new Map<string, NBNote>();;
    private notesLabelsCache = new Map<string, Set<string>>();
    private editCacheDirectory: string;

    constructor(private readonly nbMasterPath: string, private readonly nbName: string) {
        this.editCacheDirectory = this.getEditCacheDirectory();
        existsSync(this.editCacheDirectory) || mkdirpSync(this.editCacheDirectory);

        if (!existsSync(this.getNotesFile())) {
            this.permanent();
        }
        this.cacheNotes();
    }

    // public getLabelsOfNotebook(): string[] {
    //     return [...this.notesLabelsCache.get(nbName)!.keys()];
    // }

    public getEditCacheDirectory() {
        return path.join(this.nbMasterPath, this.nbName, 'cache');
    }

    public removeNote(nId: string) {
        // l_g_name: label group name
        for (const [l_g_name, labels] of Object.entries(this.getNoteByid(nId).labels)) {
            for (const label of labels) {
                const n_label = `${l_g_name}->${label}`
                this.notesLabelsCache.get(n_label)?.delete(nId);
            }
        }
        this.notesLabelsCache.get(this.nbName)?.delete(nId);
        this.notesCache.delete(nId);
        this.permanent();
    }



    // public getNBLabels(): Map<string, Set<string>> {
    //     this.cacheNotes(nbName);
    //     return this.notesLabelsCache.get(nbName) || new Map();
    // }

    public permanent() {
        vfs.writeJsonSync(this.getNotesFile(), Object.fromEntries(this.notesCache.entries()));
    }



    public cacheNotes() {
        this.notesLabelsCache.set(this.nbName, new Set<string>());
        for (const [nId, note] of Object.entries(this.loadNotes())) {
            // cache notes file
            this.notesCache.set(nId, new NBNote(",", nId, note));

            // all note have an nbname label
            this.notesLabelsCache.get(this.nbName)?.add(nId);
            // cache nid by labels
        }
        for (const [l_g_name, labels] of Object.entries(this.getNoteByid(nId).labels)) {
            for (const label of labels) {
                const n_label = `${l_g_name}->${label}`
                if (this.notesLabelsCache.get(n_label)?.add(nId) === undefined) {
                    this.notesLabelsCache.set(n_label, new Set<string>([nId]));
                }
            }
        }
    }

    public updateNote(nId: string, contents: string[], labels: string[]) {
        const n = this.getNoteByid(nId);
        n.contents = contents.map(c => c.replace('\r\n', '\n').trim());
        n.mts = (new Date()).getTime();
        n.labels = labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName));
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





    public addDoc(nId: string) {
        const docDir = path.join(this.nbMasterPath, this.nbName, 'doc', nId);
        mkdirpSync(docDir);
        const docMainFile = path.join(docDir, 'README.md');
        vfs.writeFileSync(docMainFile, '');
    }

    public addFiles(nId: string) {
        const filesDir = this.getFilesPath(nId)
        mkdirpSync(filesDir);
    }

    public getDocMainFile(nId: string) {
        return path.join(this.nbMasterPath, this.nbName, 'doc', nId, 'README.md');
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

    public loadNotes(): { [nId: string]: INBNote } {
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
        this.notesCache.set(nId, { contents: [''], cts: ts, mts: ts, labels: labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName)) });
        // this.writeNBDomains(domainNode[0]);
        this.permanent();
        return nId;
    }

    public resetLabels(nId: string, labels: string[]) {
        // this.clearLabels(nId);
        const n = this.getNoteByid(nId);
        n.labels = labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName));
        this.permanent();
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