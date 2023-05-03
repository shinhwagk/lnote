"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LNotebook = void 0;
const fs_extra_1 = require("fs-extra");
const domain_1 = require("./domain");
const notes_1 = require("./notes");
class LNotebook {
    nb;
    dir;
    ldomain;
    lnotes;
    constructor(nb, dir) {
        this.nb = nb;
        this.dir = dir;
        (0, fs_extra_1.existsSync)(this.dir) || (0, fs_extra_1.mkdirpSync)(this.dir);
        this.ldomain = new domain_1.LDomain(this.nb, this.dir);
        this.lnotes = new notes_1.LNotes(this.nb, this.dir);
    }
    getln() {
        return this.lnotes;
    }
    getld() {
        return this.ldomain;
    }
    /**
     *
     * domain
     *
     */
    getNotesOfDomain(domainNode, strict = false) {
        const als = this.getld().getArrayLabels(domainNode);
        return this.getln().getNotesByAls(als, strict);
    }
}
exports.LNotebook = LNotebook;
//# sourceMappingURL=notebook.js.map