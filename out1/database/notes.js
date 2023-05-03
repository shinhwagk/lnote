"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LNotes = void 0;
const path = __importStar(require("path"));
const fs_extra_1 = require("fs-extra");
const helper_1 = require("../helper");
const note_1 = require("./note");
const constants_1 = require("../constants");
// lnotes
class LNotes {
    nb;
    dir;
    notesCache = new Map();
    // Set<string>: note ids
    // example: key: "<group name> -> label1", [id1,id2]
    notesGlsCache = new Map();
    lastId = helper_1.tools.generateSixString();
    notesFile;
    trashDir;
    constructor(nb, dir) {
        this.nb = nb;
        this.dir = dir;
        this.notesFile = path.join(this.dir, constants_1.notesFileName);
        (0, fs_extra_1.existsSync)(this.notesFile) || helper_1.vfs.writeJsonSync(this.notesFile, {});
        this.trashDir = path.join(this.dir, '.trash');
        (0, fs_extra_1.existsSync)(this.trashDir) || (0, fs_extra_1.mkdirpSync)(this.trashDir);
        this.cacheNotesById();
        this.cacheNotesByGls();
    }
    cacheNotesById() {
        for (const [id, note] of Object.entries(helper_1.vfs.readJsonSync(this.notesFile))) {
            this.notesCache.set(id, new note_1.LNote(this.nb, this.dir, id, note.contents, note.cts, note.mts, note.gls));
        }
    }
    cacheNotesByGls() {
        this.notesGlsCache.clear();
        for (const [nId, note] of this.notesCache.entries()) {
            // force add nb labels to note
            if (!(constants_1.nbGroup in note.gls)) {
                note.gls[constants_1.nbGroup] = [this.nb];
            }
            for (const label of (0, helper_1.groupLabels2ArrayLabels)(note.gls)) {
                if (this.notesGlsCache.get(label)?.add(nId) === undefined) {
                    this.notesGlsCache.set(label, new Set([nId]));
                }
            }
        }
        // force modify ##nb
        this.permanent();
    }
    getLastId() {
        return this.lastId;
    }
    create(gls) {
        this.lastId = helper_1.tools.generateSixString();
        const ts = (new Date()).getTime();
        gls['##nb'] = [this.nb];
        this.notesCache.set(this.lastId, new note_1.LNote(this.nb, this.dir, this.lastId, [''], ts, ts, gls));
        this.permanent();
        this.cacheNotesByGls();
    }
    delete(id) {
        this.trash(id);
        this.getById(id).getAls().forEach(l => this.notesGlsCache.get(l)?.delete(id));
        this.notesCache.delete(id);
        this.permanent();
    }
    trash(id) {
        const n = this.getById(id);
        const ts = helper_1.tools.formatDate(new Date());
        const noteTrashDir = path.join(this.trashDir, `${ts}-${id}`);
        (0, fs_extra_1.mkdirpSync)(noteTrashDir);
        helper_1.vfs.writeJsonSync(path.join(noteTrashDir, 'n.json'), n);
        if (n.checkDocExist()) {
            (0, fs_extra_1.moveSync)(n.docPath, path.join(noteTrashDir, 'doc'), { overwrite: true });
        }
        if (n.checkFilesExist()) {
            (0, fs_extra_1.moveSync)(n.filesPath, path.join(noteTrashDir, 'files'), { overwrite: true });
        }
    }
    getById(id) {
        return this.notesCache.get(id);
    }
    getIdsByAls(als) {
        const ids = [];
        for (const id of this.notesCache.keys()) {
            if (helper_1.tools.issubset(als, this.notesCache.get(id).getAls())) {
                ids.push(id);
            }
        }
        return ids;
    }
    getIdsByStrictAls(als) {
        const ids = [];
        for (const [nId, n] of this.notesCache.entries()) {
            if (als.sort().join() === (0, helper_1.groupLabels2ArrayLabels)(n.gls).sort().join()) {
                ids.push(nId);
            }
        }
        return ids;
    }
    getNotesByAls(als, strict = false) {
        const ids = strict ? this.getIdsByStrictAls(als) : this.getIdsByAls(als);
        return Array.from(new Set(ids)).sort().map(nId => this.getById(nId));
    }
    permanent() {
        helper_1.vfs.writeJsonSync(this.notesFile, Object.fromEntries(this.notesCache.entries()));
    }
    search(keywords) {
        const notes = [];
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
exports.LNotes = LNotes;
//# sourceMappingURL=notes.js.map