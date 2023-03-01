import * as path from 'path';

import * as objectPath from 'object-path';

import { tools, vfs } from '../helper';
import { existsSync } from 'fs-extra';

export interface NBDomainStruct {
    [domain: string]: NBDomainStruct;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '.labels'?: any; // { [cname:string]: string[] }
}

export class NBDomain {
    public domainCache: NBDomainStruct = {};

    constructor(private readonly nbName: string, private readonly nbDir: string) {
        if (!existsSync(this.getDomainFile())) {
            objectPath.set(this.domainCache, [this.nbName], { '.labels': [] });
            this.permanent();
        } else {
            this.setCache();
        }
    }

    public getLabelsOfDomain(domainNode: string[]): string[] {
        return objectPath.get(this.domainCache, [...domainNode, '.labels']);
    }

    public getDomainFile() {
        return path.join(this.nbDir, this.nbName, 'domains.json');
    }

    public readDomain() {
        return vfs.readJsonSync(this.getDomainFile());
    }

    public deleteDomain(domainNode: string[]): void {
        if (domainNode.length === 0) {
            return;
        }
        this.setCache();
        objectPath.del(this.domainCache, domainNode);
        this.permanent();
    }

    // public moveDomain(orgDomainNode: string[], newDomainNode: string[]) {
    //     const domain = this.getDomain(orgDomainNode);
    //     this.deleteDomain(orgDomainNode);
    //     objectPath.set(this.domainCache, newDomainNode, domain);
    //     this.permanent();
    // }

    public renameDomain(domainNode: string[], domainName: string) {
        const _d = [...domainNode];
        _d[domainNode.length - 1] = domainName;
        const domain = this.getDomain(domainNode);
        this.deleteDomain(domainNode);
        objectPath.set(this.domainCache, _d, domain);
        this.permanent();
    }

    public addDomain(domainNode: string[], labels: string[] = []) {
        this.resetLabels(domainNode, labels);
    }

    public resetLabels(domainNode: string[], labels: string[]) {
        objectPath.set(this.domainCache, [...domainNode, '.labels'], tools.duplicateRemoval(labels));
        this.permanent();
    }

    public permanent() {
        vfs.writeJsonSync(this.getDomainFile(), this.domainCache[this.nbName]);
    }

    // static getNBList(): string[] {
    //     return readdirSync(this.nbMasterPath).filter(n => existsSync(this.getNBDomainsFile(n)))
    // }

    public getDomain(domainNode: string[] = []): NBDomainStruct {
        return objectPath.get(this.domainCache, domainNode);
    }

    public setCache() {
        objectPath.set(this.domainCache, [this.nbName], this.readDomain());
    }

    public checkLabelsExist(domainNode: string[]) {
        return objectPath.get(this.domainCache, [...domainNode, '.labels'], []).length !== 0;
    }

    public getChildrenNameOfDomain(domainNode: string[] = []): string[] {
        return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.labels');
    }
}