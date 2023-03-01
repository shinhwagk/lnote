import * as path from 'path';

import {
    existsSync,
    readdirSync,
    mkdirpSync,
    statSync,
    removeSync
} from 'fs-extra';

import { NBNotes } from './notes';
import { NBDomain } from './domain';
import { tools } from '../helper';

// export interface NBDomainStruct {
//     [domain: string]: NBDomainStruct;
//     // eslint-disable-next-line @typescript-eslint/naming-convention
//     '.labels'?: any; // { [cname:string]: string[] }
// }


// interface NBNoteStruct {
//     contents: string[], cts: number, mts: number, labels: string[]
// }


// export type NoteBook = string;

// export function getAllNBNames() {
//     for (const nbName of readdirSync(this.nbMasterPath).filter(f => statSync(this.getNBDir(f)).isDirectory())) {
//         try {
//             this.cacheNB(nbName);
//         } catch (e) {
//             console.error(`nb: ${nbName}. err:${e}`);
//         }
//     }
// }

export class VNNotebook {
    private readonly domain: NBDomain;
    private readonly notes: NBNotes;

    private readonly notesEditCacheDir: string;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string
    ) {
        existsSync(this.nbDir) || mkdirpSync(this.nbDir);

        this.notesEditCacheDir = path.join(this.nbDir, 'cache');
        existsSync(this.notesEditCacheDir) || mkdirpSync(this.notesEditCacheDir);

        this.domain = new NBDomain(this.nbName, this.nbDir);
        this.notes = new NBNotes(this.nbName, this.nbDir);
    }

    /**
     * 
     * notes & note
     */

    public craeteNotes(dn: string[], labels: string[]) {
        this.addNote(labels);
        this.domain.resetLabels(dn, labels.slice(1).concat(dn));
    }

    public addNote(labels: string[]) {
        const nId = tools.generateSixString();
        this.notes.addNote(nId, labels);
        // this.domain.resetLabels(dn, labels.slice(1).concat(dn));
    }

    public getEditNoteFile(nId: string) {
        return path.join(this.notesEditCacheDir, `${nId}.yaml`);
    }

    public createEditNoteEnv(nId: string) {
        const n = this.notes.getNoteByid(nId);
        tools.writeYamlSync(this.getEditNoteFile(nId), { contents: n.contents, labels: n.labels });
    }

    public removeEditNoteEnv(nId: string) {
        removeSync(this.getEditNoteFile(nId));
    }

    public getNoteByid(nId: string) {
        return this.notes.getNoteByid(nId);
    }

    /**
     * 
     * domain
     * 
     */

    public getDomainByNode(dn: string[]) {
        return this.domain.getDomainByNode(dn);
    }

    public addDomain(dn: string[]) {
        this.domain.addDomain(dn);
    }

    public deleteDomain(dn: string[]) {
        this.domain.deleteDomain(dn);
    }

    public renameDomain(domainNode: string[], domainName: string) {
        this.domain.renameDomain(domainNode, domainName);
    }

    public getLabelsOfDomain(dn: string[]) {
        return this.domain.getLabelsOfDomain(dn);
    }
}
