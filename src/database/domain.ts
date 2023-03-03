import * as path from 'path';

import * as objectPath from 'object-path';

import { tools, vfs } from '../helper';
import { existsSync, mkdirpSync } from 'fs-extra';
import { GroupLables } from './note';

export interface NBDomainStruct {
    [domain: string]: NBDomainStruct;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '.labels'?: any; // { [cname:string]: string[] }
}

export class NBDomain {
    private domainCache: NBDomainStruct = {};
    private editDir: string;

    private readonly domainFile: string;

    constructor(
        readonly nbName: string,
        readonly nbDir: string
    ) {
        this.domainFile = path.join(this.nbDir, 'domain.json');
        existsSync(this.domainFile) || vfs.writeJsonSync(this.domainFile, { '.labels': {} });

        this.editDir = path.join(this.nbDir, 'cache', 'domain');
        existsSync(this.editDir) || mkdirpSync(this.editDir);

        objectPath.set(this.domainCache, [this.nbName], vfs.readJsonSync(this.domainFile));
    }

    public getLabels(domainNode: string[]): GroupLables[] {
        return objectPath.get(this.domainCache, [...domainNode, '.labels']);
    }

    public deleteDomain(domainNode: string[]): void {
        if (domainNode.length === 0) {
            return;
        }
        objectPath.del(this.domainCache, domainNode);
        this.permanent();
    }

    public getDomain(domainNode: string[] = []) {
        return objectPath.get(this.domainCache, domainNode);
    }

    public moveDomain(oldDomainNode: string[], newDomainNode: string[]) {
        const domain = this.getDomain(oldDomainNode);
        objectPath.set(this.domainCache, newDomainNode, domain);
        this.deleteDomain(oldDomainNode);
        this.permanent();
    }

    public renameDomain(domainNode: string[], domainName: string) {
        const newDomainNode = domainNode.slice(0, domainNode.length - 1).concat(domainName);
        this.moveDomain(domainNode, newDomainNode);
    }

    public addDomain(domainNode: string[], labels: string[] = []) {
        this.reLabels(domainNode, labels);
    }

    public reLabels(domainNode: string[], labels: string[]) {
        objectPath.set(this.domainCache, [...domainNode, '.labels'], tools.duplicateRemoval(labels));
        this.permanent();
    }

    public permanent() {
        vfs.writeJsonSync(this.domainFile, this.domainCache[this.nbName]);
    }

    // check domain node is a notes
    public isNotes(domainNode: string[]) {
        return objectPath.has(this.domainCache, [...domainNode, '.labels']);
    }

    public getChildrenNameOfDomain(domainNode: string[] = []): string[] {
        return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.labels');
    }

    public createEditEnv(domainNode: string[]) {

    }

    public getEditFile(domainNode: string[]) {
        // domainNode.join('/')
        return path.join(this.editDir, `${domainNode}.yaml`);
    }
}