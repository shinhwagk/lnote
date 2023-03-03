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

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string
    ) {
        existsSync(this.nbDir) || mkdirpSync(this.nbDir);

        this.domain = new NBDomain(this.nbName, this.nbDir);
        this.notes = new NBNotes(this.nbName, this.nbDir);
    }

    public getEditDir() {
        return this.notes.getEditDir();
    }

    /**
     * 
     * notes & note
     */

    public craeteNotes(dn: string[], labels: string[]) {
        this.addNote(labels.concat(dn));
        this.domain.resetLabels(dn, labels.concat(dn));
    }

    public addNote(labels: string[]) {
        const nId = tools.generateSixString();
        this.notes.addNote(nId, labels);
        // this.domain.resetLabels(dn, labels.slice(1).concat(dn));
    }

    public updateNote(nId: string, contents: string[], labels: string[]) {
    }

    public deleteNote(nId: string) {

    }

    public relabelNote(nId: string, labels: string[]) {

    }

    public createEditNoteEnv(nId: string) {
        this.notes.createEditNoteEnv(nId);
        return this.notes.getNoteEditFile(nId);
    }

    public removeEditNoteEnv(nId: string) {
        removeSync(this.notes.getNoteEditFile(nId));
        // removeSync(this.createNoteEditFile(nId));
    }

    public getNoteById(nId: string) {
        return this.notes.getNoteById(nId);
    }

    public removeNoteById(nId: string) {
        this.notes.removeNoteById(nId);
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

    public renameDomain(dn: string[], domainName: string) {
        this.domain.renameDomain(dn, domainName);
    }

    public getLabelsOfDomain(dn: string[]) {
        return this.domain.getLabelsOfDomain(dn);
    }
}
