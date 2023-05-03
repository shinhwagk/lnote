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
exports.LNote = void 0;
const path = __importStar(require("path"));
const fs_extra_1 = require("fs-extra");
const helper_1 = require("../helper");
const helper_2 = require("../helper");
class LNote {
    nb;
    dir;
    id;
    contents;
    cts;
    mts;
    gls;
    filesPath;
    docPath;
    docMainFile;
    // arrayLabels: Set<string> = new Set();
    // grouplabels: NoteDataGroupLabel
    constructor(nb, dir, id, contents, cts, mts, gls) {
        this.nb = nb;
        this.dir = dir;
        this.id = id;
        this.contents = contents;
        this.cts = cts;
        this.mts = mts;
        this.gls = gls;
        this.filesPath = path.join(this.dir, "files", this.id);
        this.docPath = path.join(this.dir, "doc", this.id);
        this.docMainFile = path.join(this.docPath, 'main.md');
        this.contents = contents;
        this.cts = cts;
        this.mts = mts;
        this.gls = gls;
        // this.nbName = nbName
    }
    getnb() {
        return this.nb;
    }
    getId() {
        return this.id;
    }
    // important !!!
    toJSON() {
        return {
            cts: this.cts,
            contents: this.contents,
            mts: this.mts,
            gls: this.gls
        };
    }
    getContents() {
        return this.contents;
    }
    getMts() {
        return this.mts;
    }
    getCts() {
        return this.cts;
    }
    getAls() {
        return (0, helper_2.groupLabels2ArrayLabels)(this.gls).sort();
    }
    getGls() {
        return this.gls;
    }
    removeArrayLabels(...al) {
        this.updateDataArrayLabels(this.getAls().filter(l => !al.includes(l)));
    }
    addArrayLabels(...al) {
        this.updateDataArrayLabels(this.getAls().concat(al));
    }
    removeDoc() {
        (0, fs_extra_1.removeSync)(this.docPath);
    }
    removeFiles() {
        (0, fs_extra_1.removeSync)(this.filesPath);
    }
    checkDocExist() {
        return (0, fs_extra_1.existsSync)(this.docMainFile); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }
    checkFilesExist() {
        return (0, fs_extra_1.existsSync)(this.filesPath);
    }
    createDoc() {
        (0, fs_extra_1.mkdirpSync)(this.docPath);
        helper_1.vfs.writeFileSync(this.docMainFile, '');
    }
    createFiles() {
        (0, fs_extra_1.mkdirpSync)(this.filesPath);
    }
    updateContents(contents) {
        this.contents = contents;
        this.mts = (new Date()).getTime();
    }
    updateMts() {
        this.mts = (new Date()).getTime();
    }
    updateGroupLabels(gls) {
        this.updateDataArrayLabels((0, helper_2.groupLabels2ArrayLabels)(gls));
    }
    updateDataArrayLabels(als) {
        this.gls = (0, helper_2.arrayLabels2GroupLabels)(als);
    }
    getDocMainFile() {
        return this.docMainFile;
    }
    getFilesPath() {
        return this.filesPath;
    }
}
exports.LNote = LNote;
//# sourceMappingURL=note.js.map