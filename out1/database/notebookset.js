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
const notebook_1 = require("./notebook");
class LNotebooks {
    nbMasterPath;
    nbs = new Map();
    constructor(nbMasterPath) {
        this.nbMasterPath = nbMasterPath;
        (0, fs_extra_1.existsSync)(this.nbMasterPath) || (0, fs_extra_1.mkdirpSync)(this.nbMasterPath);
        const s = (new Date()).getTime();
        this.refresh();
        console.log('cache notebooks success, time: ' + `${new Date().getTime() - s}` + 'ms');
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
        for (const nbName of (0, fs_extra_1.readdirSync)(this.nbMasterPath).filter(f => (0, fs_extra_1.statSync)(this.getDir(f)).isDirectory())) {
            try {
                this.cache(nbName);
            }
            catch (e) {
                console.error(`nb: ${nbName}. err:${e}`);
            }
        }
    }
    cache(nb) {
        this.nbs.set(nb, new notebook_1.VNNotebook(nb, this.getDir(nb)));
    }
    create(nb) {
        (0, fs_extra_1.mkdirpSync)(this.getDir(nb));
        this.cache(nb);
    }
    getDir(nb) {
        return path.join(this.nbMasterPath, nb);
    }
    get(nb) {
        return this.nbs.get(nb);
    }
    getNames() {
        return [...this.nbs.keys()];
    }
    search(keywords) {
        const notes = [];
        for (const [nbName, nb] of this.nbs.entries()) {
            if (keywords.includes(nbName)) {
                const _kws = keywords.filter(kw => kw !== nbName);
                nb.search(_kws).forEach(n => notes.push(n));
            }
        }
        return notes;
    }
}
exports.LNotebooks = LNotebooks;
//# sourceMappingURL=notebookset.js.map