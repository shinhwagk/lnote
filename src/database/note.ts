import * as path from 'path';

import {
    existsSync,
    readJSONSync,
    removeSync,
    mkdirpSync
} from 'fs-extra';

import { tools, vfs } from '../helper';

// export interface INBNote {
//     contents: string[];
//     cts: number;
//     mts: number;
//     labels: { [gl: string]: string[] }; // label group
// }

export type GroupLables = { [gl: string]: string[] }

export class NBNote {
    filesPath: string;
    docPath: string;
    docMainFile: string;

    constructor(
        private readonly nbDir: string,
        private readonly nId: string,
        public contents: string[],
        private readonly cts: number,
        public mts: number,
        public labels: GroupLables // label group
    ) {
        this.filesPath = path.join(this.nbDir, "files", nId);
        this.docPath = path.join(this.nbDir, "doc", nId);
        this.docMainFile = path.join(this.docPath, 'main.md');
    }

    static create(
        nbDir: string,
        nId: string,
        contents: string[],
        cts: number,
        mts: number,
        labels: { [gl: string]: string[] }
    ) {
        return new NBNote(nbDir, nId, contents, cts, mts, labels);
    }

    toJSON() {
        return {
            contents: this.contents,
            cts: this.cts,
            mts: this.mts,
            labels: this.labels
        }
    }

    // public update()

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

    public addDoc() {
        mkdirpSync(this.docPath);
        vfs.writeFileSync(this.docMainFile, '');
    }

    public addFiles() {
        mkdirpSync(this.filesPath);
    }

    public updateContents(contents: string[]) {
        this.contents = contents

    }

    public updateMts(mts: number) {
        this.mts = mts
    }

    public updateLabels(labels: GroupLables) {
        this.labels = labels
    }

    public add(labels: string[]) {

    }

    public getDocMainFile() {
        return this.docMainFile
    }

    public getFilesPath() {
        return this.filesPath
    }
}