import * as path from 'path';

import {
    existsSync,
    readJSONSync
} from 'fs-extra';

import { tools, vfs } from '../helper';
import { GroupLables, NBNote } from './note';

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
    for (const gl of Object.keys(groupLabels)) {
        for (const l of groupLabels[gl]) {
            const n_label = `${gl}->${l}`;
            labels.push(n_label);
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
    private notesCache = new Map<string, NBNote>();
    private notesGroupedByLabelCache = new Map<string, Set<string>>(); // Set<string>: note ids

    private readonly notesFile: string;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string

    ) {
        this.notesFile = path.join(this.nbDir, 'notes.json');
        existsSync(this.notesFile) || vfs.writeFileSync(this.notesFile, '');

        this.notesCache = new Map(Object.entries(vfs.readJsonSync(this.notesFile)));

        this.cacheNotesGroupedByLabelCache();
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
        const noteLabels = labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName))
        const note = { contents: [''], cts: ts, mts: ts, labels: noteLabels };
        this.notesCache.set(nId, note);
        this.permanent();
    }

    public updateNote(nId: string, contents: string[], labels: string[]) {
        const n = this.getNoteByid(nId);
        n.updateContents(contents.map(c => c.replace('\r\n', '\n').trim()))
        n.updateMts((new Date()).getTime())
        n.updateLabels(labels2GroupLabel(tools.elementRemoval(tools.duplicateRemoval(labels), this.nbName)))
        // this.notesDB.update(nId, n)
        this.notesCache.set(nId, n)
        this.permanent();
    }

    public removeNote(nId: string) {
        [...this.notesGroupedByLabelCache.values()].forEach(ids => ids.delete(nId));
        this.notesCache.delete(nId);
        this.permanent();
        // this.notesDB.delete(nId);
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
        this.permanent();
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
