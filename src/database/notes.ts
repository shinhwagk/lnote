import * as path from 'path';

import {
    existsSync,
    mkdirpSync,
    readJSONSync
} from 'fs-extra';

import { tools, vfs } from '../helper';
import { GroupLables, INBNote, NBNote } from './note';

// export interface NBDomainStruct {
//     [domain: string]: NBDomainStruct;
//     // eslint-disable-next-line @typescript-eslint/naming-convention
//     '.labels'?: any; // { [cname:string]: string[] }
// }

function labels2GroupLabel(labels: string[]): GroupLables {
    const gl: { [g: string]: string[] } = {};
    for (const label of labels) {
        const [g, l] = label.split('->');
        if (g in gl) {
            gl[g].push(l);
        } else {
            gl[g] = [l];
        }
    }
    return gl;
}

function groupLabel2Labels(groupLabels: { [gl: string]: string[] }) {
    const labels = [];
    for (const [g, ls] of Object.entries(groupLabels)) {
        for (const l of ls) {
            labels.push(`${g}->${l}`);
        }
    }
    return labels;
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
    private notesCache = new Map<string, INBNote>();
    // Set<string>: note ids
    // example: key: "<group name> -> label1", [id1,id2]
    private notesGroupedByLabelCache = new Map<string, Set<string>>();

    private readonly notesFile: string;

    public readonly editDir: string;

    constructor(
        readonly nbName: string,
        readonly nbDir: string
    ) {
        this.notesFile = path.join(this.nbDir, 'notes.json');
        existsSync(this.notesFile) || vfs.writeJsonSync(this.notesFile, {});

        this.editDir = path.join(this.nbDir, 'cache', 'notes');
        existsSync(this.editDir) || mkdirpSync(this.editDir);

        this.notesCache = new Map(Object.entries(vfs.readJsonSync(this.notesFile)));
        this.cacheNotesGroupedByLabelCache();
    }

    public getEditDir() {
        return this.editDir;
    }

    public cacheNotesGroupedByLabelCache() {
        // all note have an nbname label
        this.notesGroupedByLabelCache.set(this.nbName, new Set<string>(this.notesCache.keys()));
        for (const [nId, note] of this.notesCache.entries()) {
            for (const label of groupLabel2Labels(note.labels)) {
                if (this.notesGroupedByLabelCache.get(label)?.add(nId) === undefined) {
                    this.notesGroupedByLabelCache.set(label, new Set<string>([nId]));
                }
            }
        }
    }

    public addNote(nId: string, labels: string[]) {
        const ts = (new Date()).getTime();
        const noteLabels = labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName));
        const note = { contents: [''], cts: ts, mts: ts, labels: noteLabels };
        this.notesCache.set(nId, note);
        labels.forEach(l => this.notesGroupedByLabelCache.get(l)?.add(nId));
        this.permanent();
    }

    public updateNote(nId: string, contents: string[], labels: string[]) {
        const n = this.getNoteById(nId);
        n.updateContents(contents.map(c => c.replace('\r\n', '\n').trim()));
        n.updateMts((new Date()).getTime());
        n.updateLabels(labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName)));
        this.notesCache.set(nId, n.getData());
        this.permanent();
    }

    public deleteNote(nId: string) {
        [...this.notesGroupedByLabelCache.values()].forEach(ids => ids.delete(nId));
        this.notesCache.delete(nId);
        this.permanent();
        // this.notesDB.delete(nId);
    }

    public getNoteById(nId: string): NBNote {
        return NBNote.get(this.nbDir, nId, this.notesCache.get(nId)!);
    }

    public getNIdsByLabels(labels: string[]): string[] {
        return labels.map(l => [...this.notesGroupedByLabelCache.get(l) || []]).flatMap(i => i);
    }

    public getNotesByLabels(labels: string[]) {
        return this.getNIdsByLabels(labels).map(nId => this.getNoteById(nId));
    }

    public resetLabels(nId: string, labels: string[]) {
        // this.clearLabels(nId);
        const n = this.getNoteById(nId);
        const gl = labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName));
        n.updateLabels(gl);
        // this.notesDB.update(nId, n)
        this.permanent();
    }

    public permanent() {
        vfs.writeJsonSync(this.notesFile, Object.fromEntries(this.notesCache.entries()));
    }

    public getEditFile(nId: string) {
        return path.join(this.editDir, `${nId}.yaml`);
    }

    public createEditEnv(nId: string) {
        const n = this.getNoteById(nId);
        tools.writeYamlSync(this.getEditFile(nId), { contents: n.getData().contents, labels: n.getData().labels });
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
