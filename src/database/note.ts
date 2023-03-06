import * as path from 'path';

import {
    existsSync,
    removeSync,
    mkdirpSync
} from 'fs-extra';

import { tools, vfs } from '../helper';
import { groupLabel2Labels, labels2GroupLabel } from './notes';
import { ArrayLabels } from './types';

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
        private data: INBNote
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

    getId() {
        return this.nId
    }

    toJSON() {
        return this.data;
    }

    public getData() {
        return this.data;
    }

    public getDataArrayLabels(): ArrayLabels {
        return groupLabel2Labels(this.data.labels);
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

    public updateDataContents(contents: string[]) {
        this.data.contents = contents;
        this.data.mts = (new Date()).getTime()
    }

    public updateDataMts(mts: number) {
        this.data.mts = mts;
    }

    public updateDataGroupLabels(labels: GroupLables) {
        this.data.labels = labels;
    }

    public updateDataArrayLabels(labels: string[]) {
        this.data.labels = labels2GroupLabel(tools.duplicateRemoval(labels));
    }

    public getDocMainFile() {
        return this.docMainFile;
    }

    public getFilesPath() {
        return this.filesPath;
    }
}