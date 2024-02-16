import * as path from 'path';

import {
    existsSync, mkdirpSync, readdirSync, removeSync
} from 'fs-extra';

import { vfs } from '../helper';
import { ArrayLabels, GroupLables, INBNote } from '../types';
import { arrayLabels2GroupLabels, groupLabels2ArrayLabels } from '../helper';
import { nbGroup } from '../constants';

export class LNote {
    filesPath: string;
    docMainFile: string;

    mainFile: string = "main.md";

    als: ArrayLabels;

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
        // this.docPath = path.join(this.dir, "doc", this.id);
        this.docMainFile = path.join(this.filesPath, this.mainFile);

        this.contents = contents;
        this.cts = cts;
        this.mts = mts;
        this.gls = gls;
        this.als = groupLabels2ArrayLabels(gls).sort();
        // this.nbName = nbName
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

    public removeArrayLabels(...al: ArrayLabels) {
        this.updateArrayLabels(this.als.filter(l => !al.includes(l)));
    }

    public addArrayLabels(...al: ArrayLabels) {
        this.updateArrayLabels(this.als.concat(al));
    }

    public removeDoc() {
        // removeSync(this.docPath);
    }

    public removeFiles() {
        removeSync(this.filesPath);
    }

    public checkDocExist(): boolean {
        return existsSync(this.docMainFile); // || existsSync(this.getDocIndexFile(nId, 'README.html'));
    }

    public checkFilesExist() {
        return existsSync(this.filesPath) && readdirSync(this.filesPath).filter(f => f !== this.mainFile).length >= 1;
    }

    public createDoc() {
        mkdirpSync(this.filesPath);
        vfs.writeFileSync(this.docMainFile, '');
    }

    public createFiles() {
        mkdirpSync(this.filesPath);
    }

    public updateContents(contents: string[]) {
        this.contents = contents;
        this.updateMts();
    }

    public updateMts() {
        this.mts = (new Date()).getTime();
    }

    public updateGroupLabels(gls: GroupLables) {
        this.updateArrayLabels(groupLabels2ArrayLabels(gls));
    }

    public updateArrayLabels(als: ArrayLabels) {
        this.gls = arrayLabels2GroupLabels(als);
        this.gls[nbGroup] = [this.nb];
        this.als = als;
    }
}