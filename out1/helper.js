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
exports.groupLabels2ArrayLabels = exports.arrayLabels2GroupLabels = exports.debug = exports.tools = exports.vfs = void 0;
// import * as path from 'path';
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const fse = __importStar(require("fs-extra"));
const yaml = __importStar(require("yaml"));
const constants_1 = require("./constants");
var vfs;
(function (vfs) {
    const encoding = 'utf-8';
    function readFileSync(file) {
        return fse.readFileSync(file, { encoding });
    }
    vfs.readFileSync = readFileSync;
    function writeFileSync(file, data = '') {
        return fse.writeFileSync(file, data, { encoding });
    }
    vfs.writeFileSync = writeFileSync;
    function writeJsonSync(file, obj) {
        fse.writeJsonSync(file, obj, { encoding });
    }
    vfs.writeJsonSync = writeJsonSync;
    function readJsonSync(file) {
        return fse.readJsonSync(file, { encoding });
    }
    vfs.readJsonSync = readJsonSync;
    function removeSync(file) {
        fse.removeSync(file);
    }
    vfs.removeSync = removeSync;
    // export function ensureFileSync(file: string) {
    //     if (fse.existsSync(file)) return;
    //     if (fse.existsSync(path.dirname(file))) {
    //         vfs.writeFileSync(file, '');
    //     } else {
    //     }
    // }
})(vfs = exports.vfs || (exports.vfs = {}));
var tools;
(function (tools) {
    function stringArrayEqual(a1, a2) {
        return JSON.stringify(a1) === JSON.stringify(a2);
    }
    tools.stringArrayEqual = stringArrayEqual;
    function hexRandom(len) {
        return (0, crypto_1.randomBytes)(len).toString('hex');
    }
    tools.hexRandom = hexRandom;
    tools.intersections = (array1, array2) => array1.filter((e) => array2.indexOf(e) !== -1);
    tools.issubset = (child, father) => child.filter((e) => father.indexOf(e) !== -1).length === child.length;
    const splitter = constants_1.pathSplit;
    function joinDomainNode(domain) {
        return domain.join(splitter);
    }
    tools.joinDomainNode = joinDomainNode;
    function splitDomaiNode(domain) {
        return domain.split(splitter);
    }
    tools.splitDomaiNode = splitDomaiNode;
    function readYamlSync(path) {
        return yaml.parse((0, fs_1.readFileSync)(path, { encoding: 'utf8' }));
    }
    tools.readYamlSync = readYamlSync;
    function writeYamlSync(path, data) {
        fse.writeFileSync(path, yaml.stringify(data, { aliasDuplicateObjects: false }), { encoding: 'utf8' });
    }
    tools.writeYamlSync = writeYamlSync;
    function duplicateRemoval(arr) {
        return [...new Set(arr)];
    }
    tools.duplicateRemoval = duplicateRemoval;
    function elementRemoval(arr, elm) {
        return arr.filter(e => e !== elm);
    }
    tools.elementRemoval = elementRemoval;
    function generateSixString() {
        return tools.hexRandom(3);
    }
    tools.generateSixString = generateSixString;
    function getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    tools.getNonce = getNonce;
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    tools.formatDate = formatDate;
    // export function sortGroupLables(obj1: GroupLables): GroupLables {
    //   return Object.keys(obj1).sort().reduce(
    //     (obj, key) => {
    //       obj[key] = obj1[key].sort();
    //       return obj;
    //     },
    //     {} as GroupLables
    //   );
    // }
    function checkFileSame(f1, f2) {
        const fc1 = vfs.readFileSync(f1);
        const fc2 = vfs.readFileSync(f2);
        const fs1 = (0, crypto_1.createHash)('sha256').update(fc1).digest('hex');
        const fs2 = (0, crypto_1.createHash)('sha256').update(fc2).digest('hex');
        return fs1 === fs2;
    }
    tools.checkFileSame = checkFileSame;
})(tools = exports.tools || (exports.tools = {}));
var debug;
(function (debug) {
    function print(message, ...optionalParams) {
        console.log(message, optionalParams);
    }
    debug.print = print;
})(debug = exports.debug || (exports.debug = {}));
/**
 * grouplabels:
 * {
 *   common: ["label1", "labels"]
 * }
 *
 * arraylabels:
 * ["common->labels", "common->labels"]
 */
function arrayLabels2GroupLabels(al) {
    const tmpgl = {};
    for (const label of al) {
        const [g, l] = label.split(constants_1.jointMark);
        if (g in tmpgl) {
            tmpgl[g].add(l);
        }
        else {
            tmpgl[g] = new Set([l]);
        }
    }
    return Object.fromEntries(Object.entries(tmpgl)
        .map((v) => [v[0], Array.from(v[1])]));
}
exports.arrayLabels2GroupLabels = arrayLabels2GroupLabels;
/**
* grouplabels:
* {
*   common: ["label1", "labels"]
* }
*/
function groupLabels2ArrayLabels(gls) {
    const labels = new Set();
    for (const [g, ls] of Object.entries(gls)) {
        for (const l of ls) {
            labels.add(`${g}${constants_1.jointMark}${l}`);
        }
    }
    return Array.from(labels);
}
exports.groupLabels2ArrayLabels = groupLabels2ArrayLabels;
//# sourceMappingURL=helper.js.map