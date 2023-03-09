import * as path from 'path';

import {
    existsSync, mkdirpSync, removeSync
} from 'fs-extra';

import { tools } from '../helper';
import { NBDomain as VNBDomain } from './domain';
import { groupLabel2Labels, labels2GroupLabel, NBNotes as VNBNotes } from './notes';
import { NoteDataLabel } from '../types';
import { GroupLables as NoteDataGroupLables } from './note';

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
    kind: 'NotesSetLabels' | 'NoteData' | 'DomainGroupLabels' | 'None';
}


interface IEditNoteData extends IEdit {
    kind: 'NoteData';
    metadata: {
        nBName: string,
        nId: string,
    },
    editable: {
        contents: string[]
        groupLabels: NoteDataGroupLables,
    }
}

interface IEditNotesSetLabels extends IEdit {
    kind: 'NotesSetLabels';
    metadata: {
        nBName: string,
        domainNode: string[],
        commonGroupLabels: NoteDataGroupLables,
    },
    editable: {
        commonGroupLabels: NoteDataGroupLables
    }

}

interface IEditDomainGroupLabels extends IEdit {
    kind: 'DomainGroupLabels';
    metadata: {
        nBName: string,
        domainNode: string[]
        commonGroupLabels: NoteDataGroupLables
    },
    editable: {
        commonGroupLabels: NoteDataGroupLables
    }

}

export class VNNotebookEditor {

    public readonly editFile: string;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string
    ) {
        this.editFile = path.join(this.nbDir, 'vscode-note@edit.yml');
    }

    public getEditObj = () => tools.readYamlSync(this.editFile) as IEdit;

    public createEditNoteEnv(nId: string, contents: string[], labels: NoteDataLabel) {
        const ed = { kind: 'NoteData', nbName: this.nbName, nId: nId, contents: contents, labels: labels };
        tools.writeYamlSync(this.editFile, ed);
    }

    public checkEditEnvCleaed() {
        return existsSync(this.editFile);
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
        this.domain.reLabels(dn, labels.concat(dn));
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
        return groupLabel2Labels(this.getGroupLabelOfDomain(dn));
    }

    public getGroupLabelOfDomain(dn: string[]) {
        return tools.sortGroupLables(this.domain.getGroupLabel(dn));
    }

    /**
     * 
     * edit
     * 
     */
    public processEditEnv(dn: string[]) {
        const editObj: IEdit = this.editor.getEditObj();
        if (editObj.kind == 'NoteData') {
            const eo = editObj as IEditNoteData;
            const n = this.notes.getNoteById(eo.metadata.nId);
            n.updateDataContents(eo.editable.contents);
            n.updateDataGroupLabels(eo.editable.groupLabels);
            this.notes.permanent();
        } else if (editObj.kind === 'NotesSetLabels') {
            const eo = editObj as IEditNotesSetLabels;
            const mcgl = groupLabel2Labels(eo.metadata.commonGroupLabels);
            const notes = this.notes.getNotesByArrayLabels(mcgl);
            const ecgl = groupLabel2Labels(eo.editable.commonGroupLabels);
            for (const n of notes) {
                const nlabels = n.getDataArrayLabels().filter(l => !mcgl.includes(l)).concat(ecgl);
                this.notes.reLabels(n.getId(), nlabels);
            }
            this.notes.permanent();
        } else if (editObj.kind === 'DomainGroupLabels') {
            const eo = editObj as IEditDomainGroupLabels;
            this.domain.getGroupLabel()
        }
        // if (editObj.kind === 'NoteData') {

        // } else if (editObj.kind === 'DomainGroupLabel') { }
        console.log("processEditEnv");
        // this.deleteEditEnv();
    }

    public checkEditEnvCleaed() {
        return this.editor.checkEditEnvCleaed();
    }

    public createEditNoteEnv(nId: string) {
        const nd = this.notes.getNoteById(nId).getData();
        this.editor.createEditNoteEnv(nId, nd.contents, nd.labels);
        const ed = { kind: 'NoteData', nId: nId, contents: nd.contents, labels: nd.labels };
        tools.writeYamlSync(this.editFile, ed);
    }

    public createEditDomainEnv(domainNode: string[]) {
        const gl = this.domain.getGroupLabel(domainNode);
        const ed = { kind: 'DomainGroupLabel', domainNode: domainNode.join('/'), groupLabel: gl };
        tools.writeYamlSync(this.editFile, ed);
    }

    public createEditNotesSetLabelsEnv(domainNode: string[], labels: string[]) {
        const gl = labels2GroupLabel(labels);
        const glOfDomain = this.getGroupLabelOfDomain(domainNode);
        const ed = { kind: 'NotesSetLabels', domainLabels: glOfDomain, notesSetlabels: gl };
        tools.writeYamlSync(this.editFile, ed);
    }

    public clearEditEnv() {
        removeSync(this.editFile);
    }
}
