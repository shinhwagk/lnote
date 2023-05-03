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
exports.LEditor = void 0;
const path = __importStar(require("path"));
const fs_extra_1 = require("fs-extra");
const constants_1 = require("../constants");
const helper_1 = require("../helper");
class LEditor {
    dir;
    editDir;
    // public readonly editorFile: string;
    editArchiveDir;
    curEditor = 'note';
    constructor(dir) {
        this.dir = dir;
        this.editDir = path.join(this.dir, '.editor');
        (0, fs_extra_1.existsSync)(this.editDir) || (0, fs_extra_1.mkdirpSync)(this.editDir);
        this.editArchiveDir = path.join(this.editDir, 'archives');
        (0, fs_extra_1.existsSync)(this.editArchiveDir) || (0, fs_extra_1.mkdirpSync)(this.editArchiveDir);
    }
    getEditorFile = () => path.join(this.editDir, `${constants_1.section}-${this.curEditor}.yml`);
    getEditorPreviousVersionFile = () => path.join(this.editDir, `${constants_1.section}-${this.curEditor}-pv.yml`);
    checkEditorFile = () => (0, fs_extra_1.existsSync)(this.getEditorFile());
    trySetEditor(ekind) {
        this.curEditor = ekind;
        return this.checkEditorFile();
    }
    createNoteEditor(nb, id, gls, contents) {
        const ed = {
            nb: nb,
            id: id,
            gls: gls,
            contents: contents
        };
        helper_1.tools.writeYamlSync(this.getEditorPreviousVersionFile(), ed);
        helper_1.tools.writeYamlSync(this.getEditorFile(), ed);
    }
    createNotesGlsEditor(ps) {
        const ed = {
            nb: ps.nb,
            ids: ps.ids,
            gls: ps.gls
        };
        helper_1.tools.writeYamlSync(this.getEditorPreviousVersionFile(), ed);
        helper_1.tools.writeYamlSync(this.getEditorFile(), ed);
    }
    createDomainEditor(dn, gls) {
        const ed = {
            dn: dn,
            gls: gls
        };
        helper_1.tools.writeYamlSync(this.getEditorPreviousVersionFile(), ed);
        helper_1.tools.writeYamlSync(this.getEditorFile(), ed);
    }
    archiveEditor() {
        if (!helper_1.tools.checkFileSame(this.getEditorPreviousVersionFile(), this.getEditorFile())) {
            const ts = helper_1.tools.formatDate(new Date());
            const aef = {
                previous: helper_1.tools.readYamlSync(this.getEditorPreviousVersionFile()),
                modified: helper_1.tools.readYamlSync(this.getEditorFile()),
                timestamp: ts
            };
            const archiveFile = path.join(this.editArchiveDir, `${ts}.${this.curEditor}.yml`);
            helper_1.tools.writeYamlSync(archiveFile, aef);
        }
        (0, fs_extra_1.removeSync)(this.getEditorFile());
        (0, fs_extra_1.removeSync)(this.getEditorPreviousVersionFile());
    }
}
exports.LEditor = LEditor;
//# sourceMappingURL=editor.js.map