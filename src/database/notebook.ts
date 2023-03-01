import * as path from 'path';

import {
    existsSync,
    readdirSync,
    mkdirpSync,
    statSync
} from 'fs-extra';

import { NBNotes } from './notes';
import { NBDomain } from './domain';

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
    constructor(private readonly nbName: string, private readonly nbDir: string) {
        this.domain = new NBDomain(this.nbName, this.nbDir);
        this.notes = new NBNotes(this.nbName, this.nbDir);
    }

}




// interface DomainInterface {
//     createDomain(): void
//     deleteDomain(): void
//     renameDomain(): void
// }
