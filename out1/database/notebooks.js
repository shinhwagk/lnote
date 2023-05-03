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
exports.LNotebooks = void 0;
const path = __importStar(require("path"));
const fs_extra_1 = require("fs-extra");
const constants_1 = require("../constants");
const helper_1 = require("../helper");
const editor_1 = require("./editor");
const notebook_1 = require("./notebook");
class LNotebooks {
    masterPath;
    nbs = new Map();
    editor;
    constructor(masterPath) {
        this.masterPath = masterPath;
        (0, fs_extra_1.existsSync)(this.masterPath) || (0, fs_extra_1.mkdirpSync)(this.masterPath);
        this.editor = new editor_1.LEditor(masterPath);
        const _s = (new Date()).getTime();
        this.refresh();
        console.log(`lnotes: cache notebooks success, time: ${new Date().getTime() - _s} ms.`);
    }
    refresh(nb = undefined) {
        if (nb === undefined) {
            this.nbs.clear();
            this.cacheAll();
        }
        else {
            this.cache(nb);
        }
    }
    cacheAll() {
        for (const nb of this.getNames()) {
            try {
                this.cache(nb);
            }
            catch (e) {
                console.error(`nb: ${nb}.err: ${e}`);
            }
        }
    }
    cache(nb) {
        this.nbs.set(nb, new notebook_1.LNotebook(nb, this.getDir(nb)));
    }
    create = this.cache;
    remove(nb) {
        this.trash(nb);
        this.nbs.delete(nb);
    }
    trash(nb) {
        const ts = helper_1.tools.formatDate(new Date());
        (0, fs_extra_1.moveSync)(this.getDir(nb), path.join(this.masterPath, '.trash', `${ts}-${nb}`), { overwrite: true });
    }
    getDir(nb) {
        return path.join(this.masterPath, nb);
    }
    get(nb) {
        return this.nbs.get(nb);
    }
    rename(nb, nnb) {
        if (!(0, fs_extra_1.existsSync)(this.getDir(nnb))) {
            (0, fs_extra_1.copySync)(this.getDir(nb), this.getDir(nnb));
            this.trash(nb);
            this.cache(nnb);
        }
    }
    getNames() {
        return (0, fs_extra_1.readdirSync)(this.masterPath)
            .filter(f => !['.editor', '.trash'].includes(f))
            .filter(f => (0, fs_extra_1.statSync)(this.getDir(f)).isDirectory());
    }
    search(keywords) {
        return Array.from(this.nbs.entries()).map(([n, nb]) => {
            if (keywords.includes(n)) {
                const _kws = keywords.filter(kw => kw !== n);
                return nb.getln().search(_kws);
            }
            return [];
        }).flatMap(n => n);
    }
    /**
     *
     * edit
     *
     */
    processEditor() {
        switch (this.editor.curEditor) {
            case 'note':
                this.processEditNote();
                break;
            case 'notesgls':
                this.processEditNotesGroupLabels();
                break;
            case 'domaingls':
                this.processEditDomain();
                break;
            default:
                console.log("non.");
        }
    }
    processEditNote() {
        const en = helper_1.tools.readYamlSync(this.editor.getEditorFile());
        const lnb = this.get(en.nb);
        const n = lnb.getln().getById(en.id);
        n.updateContents(en.contents);
        n.updateGroupLabels(en.gls);
        n.updateMts();
        lnb.getln().permanent();
    }
    processEditNotesGroupLabels() {
        const e = helper_1.tools.readYamlSync(this.editor.getEditorFile());
        const als = (0, helper_1.groupLabels2ArrayLabels)(e.gls);
        const nb = als[0].split(constants_1.jointMark)[1];
        for (const id of e.ids) {
            this.get(nb).getln().getById(id).updateGroupLabels(e.gls);
        }
        this.get(nb).getln().permanent();
    }
    processEditDomain() {
        const e = helper_1.tools.readYamlSync(this.editor.getEditorFile());
        if (e.gls) {
            this.get(e.dn[0]).getld().updateGls(e.dn, e.gls);
        }
        else {
            this.get(e.dn[0]).getld().deleteNotes(e.dn);
        }
        this.cache(e.dn[0]);
    }
    createNoteEditor(nb, id) {
        const nd = this.get(nb).getln().getById(id);
        this.editor.createNoteEditor(nb, id, nd.getGls(), nd.getContents());
    }
    createNotesGroupLabelsEditor(als) {
        const nbl = als.filter(al => al.startsWith(`${constants_1.nbGroup}${constants_1.jointMark}`));
        if (this.editor.trySetEditor('notesgls')) {
            return;
        }
        if (nbl.length >= 1) {
            const nb = nbl[0].split(constants_1.jointMark)[1];
            const notes = this.get(nb).getln().getNotesByAls(als, true);
            this.editor.createNotesGlsEditor({ nb: nb, ids: notes.map(n => n.getId()), gls: (0, helper_1.arrayLabels2GroupLabels)(als) });
        }
    }
    createDomainGlsEditor(dn) {
        if (this.editor.trySetEditor('domaingls')) {
            return;
        }
        this.editor.createDomainEditor(dn, this.get(dn[0]).getld().getGroupLabels(dn));
    }
}
exports.LNotebooks = LNotebooks;
//# sourceMappingURL=notebooks.js.map