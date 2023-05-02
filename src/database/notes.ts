import * as path from 'path';

import {
    existsSync
} from 'fs-extra';

import { tools, vfs } from '../helper';
import { LNote } from './note';

import { ArrayLabel, ArrayLabels, GroupLables, INBNote, NoteId } from '../types';
import { jointMark, notesFileName } from '../constants';

/**
 * grouplabels:
 * {
 *   common: ["label1", "labels"]
 * }
 * 
 * arraylabels:
 * ["common->labels", "common->labels"]
 */
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

/**
 * grouplabels:
 * {
 *   common: ["label1", "labels"]
 * }
 */
export function groupLabels2ArrayLabels(gls: GroupLables): ArrayLabels {
    const labels = new Set<string>();
    for (const [g, ls] of Object.entries(gls)) {
        for (const l of ls) {
            labels.add(`${g}${jointMark}${l}`);
        }
    }
    return Array.from(labels);
}

// lnotes
export class LNotes {
    private notesCache = new Map<string, LNote>();
    // Set<string>: note ids
    // example: key: "<group name> -> label1", [id1,id2]
    private notesGroupedByLabelCache = new Map<ArrayLabel, Set<string>>();

    private readonly notesFile: string;

    constructor(
        readonly nb: string,
        readonly dir: string
    ) {
        this.notesFile = path.join(this.dir, notesFileName);
        existsSync(this.notesFile) || vfs.writeJsonSync(this.notesFile, {});

        // this.notesCache = new Map(Object.entries(vfs.readJsonSync(this.notesFile)));
        // [...this.notesCache.values()].forEach(n => n.labels['##nb'] = [this.nb]);
        this.cacheNotesGroupedByLabelCache();
    }

    public cacheNotes() {
        for (const [id, note] of Object.entries(vfs.readJsonSync<INBNote>(this.notesFile))) {
            this.notesCache.set(id, LNote.get(this.nb, this.dir, id, note.contents, note.cts, note.mts, note.gls));
        }
    }

    public cacheNotesGroupedByLabelCache() {
        for (const [nId, note] of this.notesCache.entries()) {
            // force add nb labels to note
            if (note.gls['##nb']) {
                note.gls['##nb'] = [this.nb];
            }
            for (const label of groupLabels2ArrayLabels(note.gls)) {
                if (this.notesGroupedByLabelCache.get(label)?.add(nId) === undefined) {
                    this.notesGroupedByLabelCache.set(label, new Set<string>([nId]));
                }
            }
        }
    }

    public add(gls: GroupLables) {
        const id = tools.generateSixString();
        const ts = (new Date()).getTime();
        gls['##nb'] = [this.nb];
        this.notesCache.set(id, LNote.get(this.nb, this.dir, id, [''], ts, ts, gls));
        // this.getNoteById(nId).updateDataArrayLabels(labels);
        this.cache(id);
        this.permanent();
    }

    public deleteNote(id: NoteId) {
        this.deleteCache(id);
        this.permanent();
    }

    public getNoteById(id: NoteId): LNote {
        return this.notesCache.get(id)!
    }

    public getIdsByAls(als: ArrayLabels): string[] {
        const ids = [];
        for (const id of this.notesCache.keys()) {
            console.log('xxxxxx', id, this.notesCache.get(id), typeof (this.notesCache.get(id)))
            if (tools.issubset(als, this.notesCache.get(id)!.getAls())) {
                ids.push(id);
            }
        }
        return ids;
    }

    public getIdsByStrictAls(als: ArrayLabels): string[] {
        const ids = [];
        for (const [nId, n] of this.notesCache.entries()) {
            if (als.sort().join() === groupLabels2ArrayLabels(n.gls).sort().join()) {
                ids.push(nId);
            }
        }
        return ids;
    }

    public getNotesByArrayLabels(al: ArrayLabels, strict: boolean) {
        const ids = strict ? this.getIdsByStrictAls(al) : this.getIdsByAls(al);
        return Array.from(new Set<string>(ids)).sort().map(nId => this.getNoteById(nId));
    }

    public permanent() {
        vfs.writeJsonSync(this.notesFile, Object.fromEntries(this.notesCache.entries()));
    }

    public cache(id: NoteId) {
        this.getNoteById(id).getAls().forEach(l => this.notesGroupedByLabelCache.get(l)?.add(id));
    }

    public deleteCache(id: NoteId) {
        // [...this.notesGroupedByLabelCache.values()].forEach(ids => ids.delete(nId));
        this.getNoteById(id)
            .getAls()
            .forEach(l => this.notesGroupedByLabelCache.get(l)?.delete(id));
        this.notesCache.delete(id);
    }

    public getCache() {
        return this.notesCache;
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
