import * as path from 'path';

import {
    existsSync,
    removeSync,
    mkdirpSync
} from 'fs-extra';

import { vfs } from '../helper';

export interface INBNote {
    contents: string[];
    cts: number;
    mts: number;
    labels: { [gl: string]: string[] }; // label group
}

export type GroupLables = { [gl: string]: string[] };

export class NBNote {
    filesPath: string;
    docPath: string;
    docMainFile: string;

    constructor(
        private readonly nbDir: string,
        private readonly nId: string,
        public data: INBNote
    ) {
        this.filesPath = path.join(this.nbDir, "files", this.nId);
        this.docPath = path.join(this.nbDir, "doc", this.nId);
        this.docMainFile = path.join(this.docPath, 'main.md');
    }

    static get(
        nbDir: string,
        nId: string,
        data: INBNote
    ) {
        return new NBNote(nbDir, nId, data);
    }

    toJSON() {
        return this.data;
    }

    public getData() {
        return this.data;
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
        this.data.contents = contents;
    }

    public updateMts(mts: number) {
        this.data.mts = mts;
    }

    public updateLabels(labels: GroupLables) {
        this.data.labels = labels;
    }

    public getDocMainFile() {
        return this.docMainFile;
    }

    public getFilesPath() {
        return this.filesPath;
    }
}