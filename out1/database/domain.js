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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LDomain = void 0;
const fs_extra_1 = require("fs-extra");
const object_path_1 = __importDefault(require("object-path"));
const path = __importStar(require("path"));
const helper_1 = require("../helper");
class LDomain {
    nb;
    dir;
    domainFile;
    domainCache = {};
    constructor(nb, dir) {
        this.nb = nb;
        this.dir = dir;
        this.domainFile = path.join(this.dir, 'domains.json');
        (0, fs_extra_1.existsSync)(this.domainFile) || this.create([this.nb]);
        this.domainCache = helper_1.vfs.readJsonSync(this.domainFile);
    }
    getGroupLabels(domainNode) {
        return object_path_1.default.get(this.domainCache, [...domainNode, '.gls']);
    }
    getArrayLabels(domainNode) {
        return (0, helper_1.groupLabels2ArrayLabels)(this.getGroupLabels(domainNode));
    }
    // public getArrayLabel(domainNode: string[]): GroupLables {
    //     return objectPath.get(this.domainCache, [...domainNode, '.gls']);
    // }
    remove(domainNode) {
        if (domainNode.length === 0) {
            return;
        }
        object_path_1.default.del(this.domainCache, domainNode);
        this.permanent();
    }
    deleteNotes(domainNode) {
        if (domainNode.length === 0) {
            return;
        }
        object_path_1.default.del(this.domainCache, [...domainNode, '.gls']);
        this.permanent();
    }
    getDomain(domainNode = []) {
        return object_path_1.default.get(this.domainCache, domainNode);
    }
    moveDomain(oldDomainNode, newDomainNode) {
        const domain = this.getDomain(oldDomainNode);
        object_path_1.default.set(this.domainCache, newDomainNode, domain);
        this.remove(oldDomainNode);
        this.permanent();
    }
    renameDomain(domainNode, domainName) {
        const newDomainNode = domainNode.slice(0, domainNode.length - 1).concat(domainName);
        this.moveDomain(domainNode, newDomainNode);
    }
    // , labels: GroupLables = { 'common': [] }
    create(domainNode) {
        object_path_1.default.set(this.domainCache, [...domainNode], {});
        this.permanent();
    }
    updateGls(domainNode, gls) {
        object_path_1.default.set(this.domainCache, [...domainNode, '.gls'], (0, helper_1.arrayLabels2GroupLabels)((0, helper_1.groupLabels2ArrayLabels)(gls)));
        this.permanent();
    }
    permanent() {
        helper_1.vfs.writeJsonSync(this.domainFile, this.domainCache);
    }
    // check domain node is a notes
    isNotes(domainNode) {
        return object_path_1.default.has(this.domainCache, [...domainNode, '.gls']);
    }
    getChildrenNamesOfDomain(domainNode = []) {
        return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.gls');
    }
}
exports.LDomain = LDomain;
//# sourceMappingURL=domain.js.map