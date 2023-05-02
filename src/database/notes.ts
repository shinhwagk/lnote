import * as path from 'path';

import {
    existsSync
} from 'fs-extra';

import { groupLabels2ArrayLabels, tools, vfs } from '../helper';
import { LNote } from './note';

import { ArrayLabel, ArrayLabels, GroupLables, INBNote, NoteId } from '../types';
import { notesFileName } from '../constants';



// lnotes
export class LNotes {
    private notesCache = new Map<NoteId, LNote>();
    // Set<string>: note ids
    // example: key: "<group name> -> label1", [id1,id2]
    private notesGlsCache = new Map<ArrayLabel, Set<string>>();

    private lastId = tools.generateSixString();

    private readonly notesFile: string;

    constructor(
        private readonly nb: string,
        private readonly dir: string
    ) {
        this.notesFile = path.join(this.dir, notesFileName);
        existsSync(this.notesFile) || vfs.writeJsonSync(this.notesFile, {});

        this.cacheNotesById();
        this.cacheNotesByGls();
    }

    public cacheNotesById() {
        for (const [id, note] of Object.entries(vfs.readJsonSync<INBNote>(this.notesFile))) {
            this.notesCache.set(id, new LNote(this.nb, this.dir, id, note.contents, note.cts, note.mts, note.gls));
        }
    }

    public cacheNotesByGls() {
        this.notesGlsCache.clear();
        for (const [nId, note] of this.notesCache.entries()) {
            // force add nb labels to note
            if (note.gls['##nb']) {
                note.gls['##nb'] = [this.nb];
            }
            for (const label of groupLabels2ArrayLabels(note.gls)) {
                if (this.notesGlsCache.get(label)?.add(nId) === undefined) {
                    this.notesGlsCache.set(label, new Set<string>([nId]));
                }
            }
        }
    }

    public getLastId(): NoteId {
        return this.lastId;
    }

    public create(gls: GroupLables) {
        this.lastId = tools.generateSixString();
        const ts = (new Date()).getTime();
        gls['##nb'] = [this.nb];
        this.notesCache.set(this.lastId, new LNote(this.nb, this.dir, this.lastId, [''], ts, ts, gls));
        this.permanent();
        this.cacheNotesByGls();
    }

    public delete(id: NoteId) {
        this.getById(id)
            .getAls()
            .forEach(l => this.notesGlsCache.get(l)?.delete(id));
        this.notesCache.delete(id);
        this.permanent();
    }

    public getById(id: NoteId): LNote {
        return this.notesCache.get(id)!;
    }

    public getIdsByAls(als: ArrayLabels): string[] {
        const ids = [];
        for (const id of this.notesCache.keys()) {
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

    public getNotesByAls(als: ArrayLabels, strict: boolean = false) {
        const ids = strict ? this.getIdsByStrictAls(als) : this.getIdsByAls(als);
        return Array.from(new Set<string>(ids)).sort().map(nId => this.getById(nId));
    }

    public permanent() {
        vfs.writeJsonSync(this.notesFile, Object.fromEntries(this.notesCache.entries()));
    }

    public search(keywords: string[]) {
        const notes: LNote[] = [];
        const res = keywords.map(kw => new RegExp(kw));
        for (const note of this.notesCache.values()) {
            const contentOfNote = note.contents.concat(Object.values(note.gls).flatMap(l => l)).filter(c => c.length >= 1);
            if (res.filter(re => re.test(contentOfNote.join("   "))).length === keywords.length) {
                notes.push(note);
            }
        }
        return notes;
    }
}
