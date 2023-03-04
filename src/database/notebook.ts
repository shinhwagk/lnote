import * as path from 'path';

import {
    existsSync,
    readdirSync,
    mkdirpSync,
    statSync,
    removeSync
} from 'fs-extra';

import { labels2GroupLabel, NBNotes } from './notes';
import { NBDomain } from './domain';
import { tools, vfs } from '../helper';

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

    // private readonly editDir: string;
    public readonly editFile: string;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string
    ) {
        existsSync(this.nbDir) || mkdirpSync(this.nbDir);

        this.editFile = path.join(this.nbDir, 'vscode-note@edit.yml');

        this.domain = new NBDomain(this.nbName, this.nbDir);
        this.notes = new NBNotes(this.nbName, this.nbDir);
    }

    /**
     * 
     * notes & note
     */

    public craeteNotes(dn: string[], labels: string[]) {
        this.addNote(labels.concat(dn));
        this.domain.reLabels(dn, labels.concat(dn));
    }

    public addNote(labels: string[]) {
        const nId = tools.generateSixString();
        this.notes.addNote(nId, labels);
        // this.domain.resetLabels(dn, labels.slice(1).concat(dn));
    }

    public updateNote(nId: string, contents: string[], labels: string[]) {
    }

    public deleteNote(nId: string) {
        this.notes.deleteNote(nId);
    }

    public relabelNote(nId: string, labels: string[]) {

    }

    public checkEditEnvClear() {
        return existsSync(this.editFile);
    }

    public createEditNoteEnv(nId: string) {
        const nd = this.notes.getNoteById(nId).getData();
        const ed = { kind: 'NoteData', nId: nId, contents: nd.contents, labels: nd.labels };
        tools.writeYamlSync(this.editFile, ed);
    }

    public createEditDomainEnv(domainNode: string[]) {
        const gl = this.domain.getGroupLabel(domainNode);
        const ed = { kind: 'DomainGroupLabel', domainNode: domainNode.join('/'), groupLabel: gl };
        tools.writeYamlSync(this.editFile, ed);
    }

    public createEditNotesGroupLabelEnv(labels: string[]) {
        const gl = labels2GroupLabel(labels);
        const ed = { kind: 'NoteGroupLabel', groupLabel: gl };
        tools.writeYamlSync(this.editFile, ed);
    }

    public deleteEditEnv() {
        removeSync(this.editFile);
    }

    public getNoteById(nId: string) {
        return this.notes.getNoteById(nId);
    }

    /**
     * 
     * domain
     * 
     */

    public getDomainByNode(dn: string[]) {
        return this.domain.getDomain(dn);
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
        return this.domain.getGroupLabel(dn);
    }

}
