import * as path from 'path';

import * as objectPath from 'object-path';

import { vfs } from '../helper';

export interface NBDomainStruct {
    [domain: string]: NBDomainStruct;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '.labels'?: any; // { [cname:string]: string[] }
}

export class NBDomain {
    public domainCache: NBDomainStruct = {};

    constructor(private readonly nbMasterPath: string, private readonly nbName: string) {
        this.setCache();
    }

    public getLabelsOfDomain(domainNode: string[]): string[] {
        return objectPath.get(this.domainCache, [...domainNode, '.labels']);
    }

    public getDomainFile() {
        return path.join(this.nbMasterPath, this.nbName, 'domains.json');
    }

    public readDomain() {
        return vfs.readJsonSync(this.getDomainFile());
    }

    public deleteDomain(domainNode: string[]): void {
        if (domainNode.length === 0) {
            return;
        }
        objectPath.del(this.domainCache, domainNode);
        this.permanentDomains();
    }

    public moveDomain(orgDomainNode: string[], newDomainNode: string[]) {
        const domain = this.getDomain(orgDomainNode);
        this.deleteDomain(orgDomainNode);
        objectPath.set(this.domainCache, newDomainNode, domain);
    }

    public renameDomain(domainNode: string[], domainName: string) {
        const _d = [...domainNode];
        _d[domainNode.length - 1] = domainName;
        const domain = this.getDomain(domainNode);
        this.deleteDomain(domainNode);
        objectPath.set(this.domainCache, _d, domain);
        this.permanentDomains();
    }

    public addDomain(domainNode: string[], labels: string[] = []) {
        this.resetLabels(domainNode, labels);
    }

    public resetLabels(domainNode: string[], labels: string[]) {
        objectPath.set(this.domainCache, [...domainNode, '.labels'], labels);
        this.permanentDomains();
    }

    public permanentDomains() {
        vfs.writeJsonSync(this.getDomainFile(), this.domainCache);
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