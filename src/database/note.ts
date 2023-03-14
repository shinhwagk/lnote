import * as path from 'path';

import {
    existsSync, mkdirpSync, removeSync
} from 'fs-extra';

import { vfs } from '../helper';
import { ArrayLabels, GroupLables } from '../types';
import { arrayLabels2GroupLabel, groupLabel2ArrayLabels } from './notes';

export interface INBNote {
    contents: string[];
    cts: number;
    mts: number;
    labels: GroupLables; // label group
}

export class NBNote {
    filesPath: string;
    docPath: string;
    docMainFile: string;

    // arrayLabels: Set<string> = new Set();
    // grouplabels: NoteDataGroupLabel

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
        return this.nId;
    }

    toJSON() {
        return this.data;
    }

    public getData() {
        return this.data;
    }

    public getDataArrayLabels(): ArrayLabels {
        return groupLabel2ArrayLabels(this.getData().labels).sort();
    }

    public removeDataArrayLabels(...al: ArrayLabels) {
        this.updateDataArrayLabels(this.getDataArrayLabels().filter(l => !al.includes(l)));
    }

    public addDataArrayLabels(...al: ArrayLabels) {
        this.updateDataArrayLabels(this.getDataArrayLabels().concat(al));
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
        this.data.mts = (new Date()).getTime();
    }

    public updateDataMts(mts: number) {
        this.data.mts = mts;
    }

    public updateDataGroupLabels(gl: GroupLables) {
        this.updateDataArrayLabels(groupLabel2ArrayLabels(gl));
    }

    public updateDataArrayLabels(al: string[]) {
        this.data.labels = arrayLabels2GroupLabel(al);
    }

    public getDocMainFile() {
        return this.docMainFile;
    }

    public getFilesPath() {
        return this.filesPath;
    }
}