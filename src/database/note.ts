import * as path from 'path';

import {
    existsSync, mkdirpSync, removeSync
} from 'fs-extra';

import { vfs } from '../helper';
import { ArrayLabels, GroupLables, INBNote } from '../types';
import { arrayLabels2GroupLabels, groupLabels2ArrayLabels } from '../helper';
import { nbGroup } from '../constants';

export class LNote {
    filesPath: string;
    docPath: string;
    docMainFile: string;

    // arrayLabels: Set<string> = new Set();
    // grouplabels: NoteDataGroupLabel

    constructor(
        public readonly nb: string,
        private readonly dir: string,
        public readonly id: string,
        public contents: string[],
        public readonly cts: number,
        public mts: number,
        public gls: GroupLables,
    ) {
        this.filesPath = path.join(this.dir, "files", this.id);
        this.docPath = path.join(this.dir, "doc", this.id);
        this.docMainFile = path.join(this.docPath, 'main.md');

        this.contents = contents;
        this.cts = cts;
        this.mts = mts;
        this.gls = gls;
        // this.nbName = nbName
    }

    public getnb() {
        return this.nb;
    }

    public getId() {
        return this.id;
    }

    // important !!!
    public toJSON(): INBNote {
        return {
            cts: this.cts,
            contents: this.contents,
            mts: this.mts,
            gls: this.gls
        };
    }

    public getContents() {
        return this.contents;
    }

    public getMts() {
        return this.mts;
    }

    public getCts() {
        return this.cts;
    }

    public getAls(): ArrayLabels {
        return groupLabels2ArrayLabels(this.gls).sort();
    }

    public getGls(): GroupLables {
        return this.gls;
    }

    public removeArrayLabels(...al: ArrayLabels) {
        this.updateDataArrayLabels(this.getAls().filter(l => !al.includes(l)));
    }

    public addArrayLabels(...al: ArrayLabels) {
        this.updateDataArrayLabels(this.getAls().concat(al));
    }

    public removeDoc() {
        removeSync(this.docPath);
    }

    public removeFiles() {
        removeSync(this.filesPath);
    }

    public checkDocExist(): boolean {
        return existsSync(this.docMainFile); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public checkFilesExist() {
        return existsSync(this.filesPath);
    }

    public createDoc() {
        mkdirpSync(this.docPath);
        vfs.writeFileSync(this.docMainFile, '');
    }

    public createFiles() {
        mkdirpSync(this.filesPath);
    }

    public updateContents(contents: string[]) {
        this.contents = contents;
        this.mts = (new Date()).getTime();
    }

    public updateMts() {
        this.mts = (new Date()).getTime();
    }

    public updateGroupLabels(gls: GroupLables) {
        this.updateDataArrayLabels(groupLabels2ArrayLabels(gls));
    }

    public updateDataArrayLabels(als: ArrayLabels) {
        this.gls = arrayLabels2GroupLabels(als);
        this.gls[nbGroup] = [this.nb];
    }

    public getDocMainFile() {
        return this.docMainFile;
    }

    public getFilesPath() {
        return this.filesPath;
    }
}