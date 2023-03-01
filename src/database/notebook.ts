import * as path from 'path';

import {
    existsSync,
    readdirSync,
    mkdirpSync,
    statSync
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

    public createNoteEditEnv;
    public getNoteEditFile;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string
    ) {
        existsSync(this.nbDir) || mkdirpSync(this.nbDir);

        this.domain = new NBDomain(this.nbName, this.nbDir);
        this.notes = new NBNotes(this.nbName, this.nbDir);

        this.createNoteEditEnv = this.notes.createEditNoteEnv;
        this.getNoteEditFile = this.notes.getEditNoteFile;
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
    /**
     * 
     * domain
     * 
     */

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




// interface DomainInterface {
//     createDomain(): void
//     deleteDomain(): void
//     renameDomain(): void
// }
