import * as path from 'path';

import {
    existsSync, mkdirpSync
} from 'fs-extra';

import { tools } from '../helper';
import { pathSplit } from '../constants';
import { NBDomain as VNBDomain } from './domain';
import { GroupLables } from '../types';
import { groupLabel2ArrayLabels, NBNotes as VNBNotes } from './notes';
import { statSync } from 'fs';

// export interface NBDomainStruct {
//     [domain: string]: NBDomainStruct;
//     // eslint-disable-next-line @typescript-eslint/naming-convention
//     '.labels'?: any; // { [cname:string]: string[] }
// }


// interface NBNoteStruct {
//     contents: string[], cts: number, mts: number, labels: string[]
// }


// export type NoteBook = string;

// export function getAllNBNames() {
//     for (const nbName of readdirSync(this.nbMasterPath).filter(f => statSync(this.getNBDir(f)).isDirectory())) {
//         try {
//             this.cacheNB(nbName);
//         } catch (e) {
//             console.error(`nb: ${nbName}. err:${e}`);
//         }
//     }
// }


interface IEdit {
    kind: 'NotesSetGroupLabels' | 'NoteData' | 'DomainGroupLabels' | 'None';
}


interface IEditNoteData extends IEdit {
    kind: 'NoteData';
    metadata: {
        nbName: string,
        nId: string,
    },
    editable: {
        contents: string[],
        groupLabels: GroupLables,
    }
}

interface IEditNotesSetGroupLabels extends IEdit {
    kind: 'NotesSetGroupLabels';
    metadata: {
        nBName: string,
        domainNode: string[],
        commonGroupLabels: GroupLables,
    },
    editable: {
        commonGroupLabels: GroupLables
    }

}

interface IEditDomainGroupLabels extends IEdit {
    kind: 'DomainGroupLabels';
    metadata: {
        nBName: string,
        domainNode: string[]
        commonGroupLabels: GroupLables
    },
    editable: {
        commonGroupLabels: GroupLables
    }

}

export class VNNotebookEditor {

    public readonly editFile: string;
    public readonly editArchiveDir: string;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string
    ) {
        this.editFile = path.join(this.nbDir, 'vscode-note@editor.yml');
        existsSync(this.editFile) || tools.writeYamlSync(this.editFile, {});

        this.editArchiveDir = path.join(this.nbDir, '.editor_archives');
        existsSync(this.editArchiveDir) || mkdirpSync(this.editArchiveDir);
    }

    public getEditorFile = () => this.editFile;

    public getEditObj = () => tools.readYamlSync(this.editFile) as IEdit;

    public createNoteData(nId: string, contents: string[], gls: GroupLables) {
        const ed: IEditNoteData = { kind: 'NoteData', metadata: { nbName: this.nbName, nId: nId }, editable: { contents: contents, groupLabels: gls } };
        tools.writeYamlSync(this.editFile, ed);
    }

    public createDomainGroupLabels(domainNode: string[], gls: GroupLables) {
        // const gl = this.domain.getGroupLabel(domainNode);
        const ed = { kind: 'DomainGroupLabels', domainNode: domainNode.join(pathSplit), groupLabels: gls };
        tools.writeYamlSync(this.editFile, ed);
    }

    public createNotesSetGroupLabels(domainNode: string[], dgls: GroupLables, gls: GroupLables) {
        const ed = { kind: 'NotesSetGroupLabels', domainNode: domainNode.join(pathSplit), domainGroupLabes: dgls, commonGroupLabels: gls };
        tools.writeYamlSync(this.editFile, ed);
    }

    public checkEditorCleaned() {
        return statSync(this.editFile).size === 0;
    }

    public archiveEditor() {
        const ts = (new Date()).getTime();
        const e: IEdit = tools.readYamlSync(this.editFile);
        const k = e.kind.match(/[A-Z]/g)!.join('').toLocaleLowerCase();
        const archiveFile = path.join(this.editArchiveDir, `${ts}.${k}.yml`);
        tools.writeYamlSync(archiveFile, e);
        tools.writeYamlSync(this.editFile, {});
    }
}


export class VNNotebook {
    private readonly domain: VNBDomain;
    private readonly notes: VNBNotes;
    private readonly editor: VNNotebookEditor;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string
    ) {
        existsSync(this.nbDir) || mkdirpSync(this.nbDir);

        this.domain = new VNBDomain(this.nbName, this.nbDir);
        this.notes = new VNBNotes(this.nbName, this.nbDir);
        this.editor = new VNNotebookEditor(nbName, nbDir);
    }

    /**
     * 
     * notes & note
     * 
     */
    public getNotesByArrayLabels(al: string[]) {
        return this.notes.getNotesByArrayLabels(al);
    }

    public craeteNotes(dn: string[], labels: string[]) {
        this.addNote(labels.concat(dn));
        this.domain.updateGroupLabels(dn, { 'common': [] });
    }

    public addNote(labels: string[]) {
        const nId = tools.generateSixString();
        this.notes.addNote(nId, labels);
        // this.domain.resetLabels(dn, labels.slice(1).concat(dn));
    }

    public updateNote(nId: string, contents: string[], labels: string[]) {
    }

    public deleteNote(nId: string) {
        this.notes.deleteNote(nId);
    }

    public relabelNote(nId: string, labels: string[]) {

    }

    public getNoteById(nId: string) {
        return this.notes.getNoteById(nId);
    }

    public getNodeFilePath(nId: string) {
        return this.notes.getNoteById(nId).getFilesPath();
    }

    /**
     * 
     * domain
     * 
     */
    public getChildrenNameOfDomain(domainNode: string[] = []): string[] {
        return this.domain.getChildrenNameOfDomain(domainNode);
    }

    public checkDomainIsNotes(domainNode: string[]) {
        return this.domain.isNotes(domainNode);
    }

    public getDomainByNode(dn: string[]) {
        return this.domain.getDomain(dn);
    }

    public addDomain(dn: string[]) {
        this.domain.addDomain(dn);
    }

    public deleteDomain(dn: string[]) {
        this.domain.deleteDomain(dn);
    }

    public renameDomain(dn: string[], domainName: string) {
        this.domain.renameDomain(dn, domainName);
    }

    public getArrayLabelsOfDomain(dn: string[]) {
        return groupLabel2ArrayLabels(this.getGroupLabelOfDomain(dn));
    }

    public getGroupLabelOfDomain(dn: string[]) {
        return this.domain.getGroupLabel(dn);
    }

    /**
     * 
     * edit
     * 
     */
    public processEditEnv() {
        const editObj: IEdit = this.editor.getEditObj();
        if (editObj.kind == 'NoteData') {
            const eo = editObj as IEditNoteData;
            const n = this.notes.getNoteById(eo.metadata.nId);
            n.updateDataContents(eo.editable.contents);
            n.updateDataGroupLabels(eo.editable.groupLabels);
            this.notes.permanent();
        } else if (editObj.kind === 'NotesSetGroupLabels') {
            const eo = editObj as IEditNotesSetGroupLabels;
            const mcgl = groupLabel2ArrayLabels(eo.metadata.commonGroupLabels);
            const notes = this.notes.getNotesByArrayLabels(mcgl);
            const ecgl = groupLabel2ArrayLabels(eo.editable.commonGroupLabels);
            for (const n of notes) {
                const nlabels = n.getDataArrayLabels().filter(l => !mcgl.includes(l)).concat(ecgl);
                this.notes.reLabels(n.getId(), nlabels);
            }
            this.notes.permanent();
        } else if (editObj.kind === 'DomainGroupLabels') {
            const eo = editObj as IEditDomainGroupLabels;
            this.domain.updateGroupLabels(eo.metadata.domainNode, eo.editable.commonGroupLabels);
        } else {
            return;
        }
        this.editor.archiveEditor()
        // if (editObj.kind === 'NoteData') {

        // } else if (editObj.kind === 'DomainGroupLabel') { }
        console.log("processEditEnv");
        // this.deleteEditEnv();
    }

    public checkEditorCleaned() {
        return this.editor.checkEditorCleaned();
    }

    public createNoteDataEditor(nId: string) {
        const nd = this.notes.getNoteById(nId).getData();
        this.editor.createNoteData(nId, nd.contents, nd.labels);
    }

    public createDomainGroupLabelsEditor(domainNode: string[]) {
        const gl = this.domain.getGroupLabel(domainNode);
        // const ed = { kind: 'DomainGroupLabel', domainNode: domainNode.join('/'), groupLabel: gl };
        this.editor.createDomainGroupLabels(domainNode, gl);
    }

    public createNotesSetGroupLabelsEditor(domainNode: string[], labels: string[]) {
        const dgls = this.getGroupLabelOfDomain(domainNode);
        this.editor.createNotesSetGroupLabels(domainNode, dgls, {});
    }

    public clearEditor() {
        this.editor.archiveEditor();
    }

    public getEditorFile() {
        return this.editor.getEditorFile()
    }
}
