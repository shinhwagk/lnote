import * as path from 'path';

import {
    existsSync,
    readdirSync,
    mkdirpSync,
    statSync
} from 'fs-extra';

import { NBNote } from './note';
import { NBDomain } from './domain';

export interface NBDomainStruct {
    [domain: string]: NBDomainStruct;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '.labels'?: any; // { [cname:string]: string[] }
}

// export interface NotebookNote {
//   nId: string;
//   cIdx: number;
//   nIdx: number;
//   category: string;
//   contents: string[];
//   isFiles: boolean;
//   isDoc: boolean;
// }

interface NotebookNotes {
    [nId: string]: NBNoteStruct
}

interface NBNoteStruct {
    contents: string[], cts: number, mts: number, labels: string[]
}

interface PostNote {
    contents: string[];
    cts: number;
    mts: number;
    labels: string[];
    doc: boolean;
    files: boolean
}

// export type NoteBook = string;

export class VNNotebook {
    private readonly nbMasterPath: string;
    private readonly nbDomainCache = new Map<string, NBDomain>();
    private readonly nbNotesCache = new Map<string, NBNote>();

    constructor(masterPath: string) {
        this.nbMasterPath = masterPath;
        this.initDirectories();
        const s = (new Date()).getTime();
        this.refresh();
        console.log('refresh domain success. time: ' + `${new Date().getTime() - s}`);
    }

    private initDirectories() {
        existsSync(this.nbMasterPath) || mkdirpSync(this.nbMasterPath);
    }

    public refresh(nbName: string | undefined = undefined): void {
        if (nbName === undefined) {
            this.nbDomainCache.clear();
            this.nbNotesCache.clear();
            this.setAllNBCache();
        } else {
            this.setNBCache(nbName);
        }
    }

    public setAllNBCache() {
        for (const nbName of readdirSync(this.nbMasterPath).filter(f => statSync(this.getNBDirectory(f)).isDirectory())) {
            try {
                this.setNBCache(nbName);
            } catch (e) {
                console.error(`nb: ${nbName}. err:${e}`);
            }
        }
    }

    public setNBCache(nbName: string) {
        console.log(`cache nb ${nbName}.`);
        this.nbNotesCache.set(nbName, new NBNote(this.nbMasterPath, nbName));
        this.nbDomainCache.set(nbName, new NBDomain(this.nbMasterPath, nbName));
    }

    public createNB(nbName: string) {
        // [...(new Set(domainNode.slice(1).concat(labels))).values()]
        mkdirpSync(this.getNBDirectory(nbName));
        this.nbNotesCache.get(nbName)?.addNote([]);
        this.nbDomainCache.get(nbName)?.addDomain([]);
    }

    public getNBDirectory(nbName: string) {
        return path.join(this.nbMasterPath, nbName);
    }

    public getNB(nbName: string) {
        return {
            domain: this.nbDomainCache.get(nbName)!,
            notes: this.nbNotesCache.get(nbName)!
        };
    }


    // public getChildrenNameOfDomain(domainNode: string[] = []): string[] {
    //     return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.labels');
    // }

    public getNoteBookNames(): string[] {
        // const domain = this.domainCache.get(domainNode[0])
        return [...this.nbDomainCache.keys()];
    }

    // public getNotesNumberUnderDomain(domainNode: string[], cnt: number = 0): number {
    //     cnt += this.getNotesNumberOfDomain(domainNode);
    //     const nbDomain = objectPath.get(this.domainCache, domainNode);
    //     const domainNames = Object.keys(nbDomain).filter(d => d !== '.labels');
    //     if (domainNames.length === 0) {
    //         return cnt;
    //     }

    //     let _cnt = 0;
    //     for (const d of domainNames) {
    //         _cnt += this.getNotesNumberUnderDomain(domainNode.concat(d));
    //     }
    //     return _cnt;
    // }

    // public getNotesNumberOfDomain(domainNode: string[]): number {
    //     const categories = objectPath.get(this.domainCache, [...domainNode, '.labels'], {});
    //     return Object.values(categories).flat().length;
    // }

    // public createCategory(domainNode: string[], cname: string, labels: string[]) {
    //   objectPath.ensureExists(this.domainTreeCache, [...domainNode, '.categories', cname], labels);
    //   this.writeNBDomains(domainNode[0]);
    // }




    // public getNotesByLabels(nbName: string, labels: string[]): any[] {
    //     const nIds = labels
    //         .map(l => { return Array.from(this.nbNotesLabelsCache.get(nbName)?.get(l)?.values() || []); })
    //         .reduce((p, c) => tools.intersections(p, c),
    //             Array.from(this.nbNotesLabelsCache.get(nbName)?.get(labels[0])?.values() || [])
    //         );
    //     return nIds.map(nId => {
    //         const note = this.nbNotesCache.get(nbName)![0][nId] as any;
    //         note['nId'] = nId;
    //         note['doc'] = this.checkDocExist(nbName, nId);
    //         note['files'] = this.checkFilesExist(nbName, nId);
    //         return note;
    //     });
    // }

    public getNotesOfDomain(domainNode: string[]): NBNoteStruct[] {
        const nbName = domainNode[0];
        const { domain, notes } = this.getNB(nbName)!;
        const labelsOfDomain = domain.getLabelsOfDomain(domainNode);
        return notes.getNotesByLabels(labelsOfDomain);
    }


}



// interface DomainInterface {
//     createDomain(): void
//     deleteDomain(): void
//     renameDomain(): void
// }
