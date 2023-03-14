import { existsSync } from 'fs-extra';
import objectPath from 'object-path';
import * as path from 'path';

import { vfs } from '../helper';
import { GroupLables } from '../types';
import { arrayLabels2GroupLabel, groupLabel2ArrayLabels } from './notes';

interface NBDomainStruct {
    [domain: string]: NBDomainStruct;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '.labels'?: any; // { [cname: string]: string[] }
}

export class VNBDomain {

    private readonly domainFile: string;
    private readonly domainCache: NBDomainStruct = {};

    constructor(
        readonly nbName: string,
        readonly nbDir: string
    ) {
        this.domainFile = path.join(this.nbDir, 'domains.json');
        existsSync(this.domainFile) || vfs.writeJsonSync(this.domainFile, { '.labels': {} });

        objectPath.set(this.domainCache, [this.nbName], vfs.readJsonSync(this.domainFile));
    }

    public getGroupLabel(domainNode: string[]): GroupLables {
        return objectPath.get(this.domainCache, [...domainNode, '.labels']);
    }

    // public getArrayLabel(domainNode: string[]): GroupLables {
    //     return objectPath.get(this.domainCache, [...domainNode, '.labels']);
    // }

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

    public addDomain(domainNode: string[], labels: GroupLables = { 'common': [] }) {
        this.updateGroupLabels(domainNode, labels);
    }

    public updateGroupLabels(domainNode: string[], gl: GroupLables) {
        objectPath.set(this.domainCache, [...domainNode, '.labels'], arrayLabels2GroupLabel(groupLabel2ArrayLabels(gl)));
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

}