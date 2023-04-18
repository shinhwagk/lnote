import * as path from 'path';

import {
    existsSync
} from 'fs-extra';

import { tools, vfs } from '../helper';
import { INBNote, NBNote } from './note';

import { ArrayLabels, GroupLables } from '../types';
import { jointMark, notesFileName } from '../constants';

// export interface NBDomainStruct {
//     [domain: string]: NBDomainStruct;
//     // eslint-disable-next-line @typescript-eslint/naming-convention
//     '.labels'?: any; // { [cname:string]: string[] }
// }

export function arrayLabels2GroupLabel(al: ArrayLabels): GroupLables {
    const tmpgl: { [g: string]: Set<string> } = {};
    for (const label of al) {
        const [g, l] = label.split(jointMark);
        if (g in tmpgl) {
            tmpgl[g].add(l);
        } else {
            tmpgl[g] = new Set([l]);
        }
    }
    return Object.fromEntries(Object.entries(tmpgl)
        .map((v) =>
            [v[0], Array.from(v[1])]
        ));
}

export function groupLabel2ArrayLabels(gl: GroupLables): ArrayLabels {
    const labels = new Set<string>();
    for (const [g, ls] of Object.entries(gl)) {
        for (const l of ls) {
            labels.add(`${g}${jointMark}${l}`);
        }
    }
    return Array.from(labels);
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

// lnotes
export class LNotes {
    private notesCache = new Map<string, INBNote>();
    // Set<string>: note ids
    // example: key: "<group name> -> label1", [id1,id2]
    private notesGroupedByLabelCache = new Map<string, Set<string>>();

    private readonly notesFile: string;

    constructor(
        readonly nbName: string,
        readonly nbDir: string
    ) {
        this.notesFile = path.join(this.nbDir, notesFileName);
        existsSync(this.notesFile) || vfs.writeJsonSync(this.notesFile, {});

        this.notesCache = new Map(Object.entries(vfs.readJsonSync(this.notesFile)));
        this.cacheNotesGroupedByLabelCache();
    }

    public cacheNotesGroupedByLabelCache() {
        // all note have an nbname label
        this.notesGroupedByLabelCache.set(this.nbName, new Set<string>(this.notesCache.keys()));
        for (const [nId, note] of this.notesCache.entries()) {
            for (const label of groupLabel2ArrayLabels(note.labels)) {
                if (this.notesGroupedByLabelCache.get(label)?.add(nId) === undefined) {
                    this.notesGroupedByLabelCache.set(label, new Set<string>([nId]));
                }
            }
        }
    }

    public addNote(nId: string, gl: GroupLables) {
        const ts = (new Date()).getTime();
        this.notesCache.set(nId, { contents: [''], cts: ts, mts: ts, labels: gl });
        // this.getNoteById(nId).updateDataArrayLabels(labels);
        this.addCache(nId);
        this.permanent();
    }

    public updateLabelsOfNote(nId: string, labels: string[]) {
        const n = this.getNoteById(nId);
        n.updateDataMts((new Date()).getTime());
        n.updateDataArrayLabels(labels);
        this.deleteCache(nId);
        this.addCache(nId);
        this.permanent();
    }

    public updateContentOfNote(nId: string, contents: string[]) {
        const n = this.getNoteById(nId);
        n.updateDataContents(contents.map(c => c.replace('\r\n', '\n').trim()));
        n.updateDataMts((new Date()).getTime());
        this.permanent();
    }

    public deleteNote(nId: string) {
        this.deleteCache(nId);
        this.notesCache.delete(nId);
        this.permanent();
    }

    public getNoteById(nId: string): NBNote {
        return NBNote.get(this.nbName, this.nbDir, nId, this.notesCache.get(nId)!);
    }

    public getNIdsByArrayLabels(labels: ArrayLabels): string[] {
        return labels.map(l => [...this.notesGroupedByLabelCache.get(l) || []]).flatMap(i => i);
    }

    public getNIdsByStrictArrayLabels(labels: ArrayLabels): string[] {
        const ids = [];
        for (const [nId, n] of this.notesCache.entries()) {
            if (labels.sort().join() === groupLabel2ArrayLabels(n.labels).join()) {
                ids.push(nId);
            }
        }
        return ids;
    }

    public getNotesByArrayLabels(al: ArrayLabels, strict: boolean) {
        const ids = strict ? this.getNIdsByStrictArrayLabels(al) : this.getNIdsByArrayLabels(al);
        return ids.map(nId => this.getNoteById(nId));
    }

    public reLabels(nId: string, labels: ArrayLabels) {
        this.deleteCache(nId);
        this.getNoteById(nId).updateDataArrayLabels(labels);
        this.addCache(nId);
        this.permanent();
    }

    public permanent() {
        this.notesCache;
        vfs.writeJsonSync(this.notesFile, Object.fromEntries(this.notesCache.entries()));
    }

    public addCache(nId: string) {
        const n = this.getNoteById(nId);
        n.getDataArrayLabels().forEach(l => this.notesGroupedByLabelCache.get(l)?.add(nId));
    }

    public deleteCache(nId: string) {
        // [...this.notesGroupedByLabelCache.values()].forEach(ids => ids.delete(nId));
        this.getNoteById(nId)
            .getDataArrayLabels()
            .forEach(l => this.notesGroupedByLabelCache.get(l)?.delete(nId));
    }

    public search(keywords: string[]): NBNote[] {
        const notes: NBNote[] = [];
        const res = keywords.map(kw => new RegExp(kw));
        for (const [nId, note] of this.notesCache.entries()) {

            const contentOfNote = note.contents.concat(Object.values(note.labels).flatMap(l => l)).filter(c => c.length >= 1);
            console.log("contentof note ", contentOfNote);
            if (res.filter(re => re.test(contentOfNote.join("   "))).length === keywords.length) {
                const n = new NBNote(this.nbName, this.nbDir, nId, note);
                notes.push(n);
            }
        }
        return notes;
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
