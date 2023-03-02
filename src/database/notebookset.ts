import * as path from 'path';

import {
    existsSync,
    readdirSync,
    mkdirpSync,
    statSync
} from 'fs-extra';

import { VNNotebook } from './notebook';

export class VNNotebookSet {
    private readonly nbCache = new Map<string, VNNotebook>();
    // private readonly nbNotesCache = new Map<string, NBNotes>();

    constructor(private readonly nbMasterPath: string) {
        existsSync(this.nbMasterPath) || mkdirpSync(this.nbMasterPath);

        const s = (new Date()).getTime();
        this.refresh();
        console.log('refresh domain success. time: ' + `${new Date().getTime() - s}`);
    }

    public refresh(nbName: string | undefined = undefined): void {
        if (nbName === undefined) {
            this.nbCache.clear();
            this.cacheAllNB();
        } else {
            this.cacheNB(nbName);
        }
    }

    private cacheAllNB() {
        for (const nbName of readdirSync(this.nbMasterPath).filter(f => statSync(this.getNBDir(f)).isDirectory())) {
            try {
                this.cacheNB(nbName);
            } catch (e) {
                console.error(`nb: ${nbName}. err:${e}`);
            }
        }
    }

    private cacheNB(nbName: string) {
        this.nbCache.set(nbName, new VNNotebook(nbName, this.getNBDir(nbName)));
    }

    public createNB(nbName: string) {
        mkdirpSync(this.getNBDir(nbName));
        this.cacheNB(nbName);
    }

    private getNBDir(nbName: string) {
        return path.join(this.nbMasterPath, nbName);
    }

    public getNB(nbName: string): VNNotebook {
        return this.nbCache.get(nbName)!;
    }

    private getNBNames(): string[] {
        return [...this.nbCache.keys()];
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

    // public getNotesOfDomain(domainNode: string[]): NBNoteStruct[] {
    //     const nbName = domainNode[0];
    //     const { domain, notes } = this.getNB(nbName)!;
    //     const labelsOfDomain = domain.getLabelsOfDomain(domainNode);
    //     return notes.getNotesByLabels(labelsOfDomain);
    // }


    // public getChildrenNameOfDomain(domainNode: string[] = []): string[] {
    //     return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.labels');
    // }

}