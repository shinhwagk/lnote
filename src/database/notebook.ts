
import {
    existsSync, mkdirpSync, removeSync
} from 'fs-extra';

import { pathSplit } from '../constants';
import { tools } from '../helper';
import { ArrayLabels, GroupLables } from '../types';
import { NBDomain as VNBDomain } from './domain';
import { arrayLabels2GroupLabel, groupLabel2ArrayLabels, NBNotes as VNBNotes } from './notes';
import { VNNotebookEditor as VNBEditor } from './editor';

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


export interface IEdit {
    kind: 'EditCommonGroupLabels' | 'EditNote' | 'EditDomain' | 'None';
}

export interface IEditNoteData extends IEdit {
    kind: 'EditNote';
    immutable: {
        nbName: string,
        nId: string,
        groupLabels: GroupLables,
        contents: string[]
    },
    editable: {
        groupLabels: GroupLables,
        contents: string[]
    }
}

interface IEditNotesCommonGroupLabels extends IEdit {
    kind: 'EditCommonGroupLabels';
    immutable: {
        nBName: string,
        domainNode: string[],
        domainGroupLabes: GroupLables
        commonGroupLabels: GroupLables
    },
    editable: {
        commonGroupLabels: GroupLables
    }

}

export interface IEditDomain extends IEdit {
    kind: 'EditDomain';
    immutable: {
        nbName: string,
        domainNode: string,
        commonGroupLabels: GroupLables
    },
    editable: {
        domainNode: string,
        commonGroupLabels: GroupLables
    }
}

export class VNNotebook {
    private readonly domain: VNBDomain;
    private readonly notes: VNBNotes;
    private readonly editor: VNBEditor;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string
    ) {
        existsSync(this.nbDir) || mkdirpSync(this.nbDir);

        this.domain = new VNBDomain(this.nbName, this.nbDir);
        this.notes = new VNBNotes(this.nbName, this.nbDir);
        this.editor = new VNBEditor(nbName, nbDir);
    }

    /**
     * 
     * notes & note
     * 
     */
    public getNotesByArrayLabels(al: string[]) {
        return this.notes.getNotesByArrayLabels(al, false);
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
        const editObj: IEdit = this.editor.getEditorObj();
        if (editObj.kind === 'EditNote') {
            const eo = editObj as IEditNoteData;
            const n = this.notes.getNoteById(eo.immutable.nId);
            n.updateDataContents(eo.editable.contents);
            n.updateDataGroupLabels(eo.editable.groupLabels);
            this.notes.permanent();
        } else if (editObj.kind === 'EditCommonGroupLabels') {
            const eo = editObj as IEditNotesCommonGroupLabels;

            const mcgl = groupLabel2ArrayLabels(eo.immutable.commonGroupLabels);
            const ecgl = groupLabel2ArrayLabels(eo.editable.commonGroupLabels);
            const dcgl = groupLabel2ArrayLabels(eo.immutable.domainGroupLabes);

            const notes = this.notes.getNotesByArrayLabels(mcgl.concat(dcgl), true);
            for (const n of notes) {
                const nlabels = n.getDataArrayLabels().filter(l => !mcgl.includes(l)).concat(ecgl).concat(dcgl);
                this.notes.reLabels(n.getId(), nlabels);
            }
            this.notes.permanent();
        } else if (editObj.kind === 'EditDomain') {
            const eo = editObj as IEditDomain;
            this.domain.updateGroupLabels(eo.immutable.domainNode.split(pathSplit), eo.editable.commonGroupLabels);
        } else {
            return;
        }
        this.editor.archiveEditor();
        // if (editObj.kind === 'EditNote') {

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
        this.editor.createDomainEditor(domainNode, gl);
    }

    public createNotesSetGroupLabelsEditor(domainNode: string[], al: ArrayLabels) {
        const dgl = this.getArrayLabelsOfDomain(domainNode);
        const gl = al.filter(l => !dgl.includes(l));
        this.editor.createNotesSetGroupLabels(domainNode, arrayLabels2GroupLabel(dgl), arrayLabels2GroupLabel(gl));
    }

    public clearEditor() {
        this.editor.archiveEditor();
    }

    public getEditorFile() {
        return this.editor.getEditorFile();
    }
}
