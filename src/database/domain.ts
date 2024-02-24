import * as path from 'path';

import { copyFileSync, existsSync, mkdirpSync } from 'fs-extra';
import objectPath from 'object-path';

import { arrayLabels2GroupLabels, groupLabels2ArrayLabels, tools, vfs } from '../helper';
import { ArrayLabels, GroupLables } from '../types';

interface NBDomainStruct {
    [domain: string]: NBDomainStruct;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '.gls'?: any; // { [cname: string]: string[] }
}

export class LDomain {

    private readonly domainFile: string;
    private readonly domainCache: NBDomainStruct = {};
    private readonly historyDir: string;

    constructor(
        readonly nb: string,
        readonly dir: string
    ) {
        this.historyDir = path.join(this.dir, 'history');
        existsSync(this.historyDir) || mkdirpSync(this.historyDir);

        this.domainFile = path.join(this.dir, 'domains.json');
        if (!existsSync(this.domainFile)) {
            // init empty file
            vfs.writeJsonSync(this.domainFile, this.domainCache)
            this.create([nb])
        }

        this.domainCache = vfs.readJsonSync<NBDomainStruct>(this.domainFile);
    }

    public getGroupLabels(domainNode: string[]): GroupLables {
        return objectPath.get(this.domainCache, [...domainNode, '.gls']);
    }

    public getArrayLabels(domainNode: string[]): ArrayLabels {
        return groupLabels2ArrayLabels(this.getGroupLabels(domainNode));
    }

    // public getArrayLabel(domainNode: string[]): GroupLables {
    //     return objectPath.get(this.domainCache, [...domainNode, '.gls']);
    // }

    public remove(domainNode: string[]): void {
        if (domainNode.length === 0) {
            return;
        }
        objectPath.del(this.domainCache, domainNode);
        this.permanent();
    }

    public deleteNotes(domainNode: string[]): void {
        if (domainNode.length === 0) {
            return;
        }
        objectPath.del(this.domainCache, [...domainNode, '.gls']);
        this.permanent();
    }

    public getDomain(domainNode: string[] = []) {
        return objectPath.get(this.domainCache, domainNode);
    }

    public moveDomain(oldDomainNode: string[], newDomainNode: string[]) {
        const domain = this.getDomain(oldDomainNode);
        objectPath.set(this.domainCache, newDomainNode, domain);
        this.remove(oldDomainNode);
        this.permanent();
    }

    public rename(domainNode: string[], domainName: string) {
        const newDomainNode = domainNode.slice(0, domainNode.length - 1).concat(domainName);
        this.moveDomain(domainNode, newDomainNode);
    }

    // , labels: GroupLables = { 'common': [] }
    public create(domainNode: string[]) {
        objectPath.set(this.domainCache, [...domainNode], {});
        this.permanent();
    }

    public updateGls(domainNode: string[], gls: GroupLables) {
        objectPath.set(this.domainCache, [...domainNode, '.gls'], arrayLabels2GroupLabels(groupLabels2ArrayLabels(gls)));
        this.permanent();
    }

    public permanent() {
        const ts = tools.formatDate(new Date());
        copyFileSync(this.domainFile, path.join(this.historyDir, `${ts}.domain.json`));
        vfs.writeJsonSync(this.domainFile, this.domainCache);
    }

    // check domain node is a notes
    public isNotes(domainNode: string[]) {
        return objectPath.has(this.domainCache, [...domainNode, '.gls']);
    }

    public getChildrenNamesOfDomain(domainNode: string[] = []): string[] {
        return Object.keys(this.getDomain(domainNode)).filter(f => f !== '.gls');
    }

}