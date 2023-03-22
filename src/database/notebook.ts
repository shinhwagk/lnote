
import {
    existsSync, mkdirpSync
} from 'fs-extra';

import { pathSplit } from '../constants';
import { tools } from '../helper';
import { ArrayLabels, GroupLables } from '../types';
import { VNBDomain } from './domain';
import { IEditBase, IEditDomain, IEditNoteData, IEditNotesCommonGroupLabels, VNBEditor } from './editor';
import { arrayLabels2GroupLabel, groupLabel2ArrayLabels, VNBNotes } from './notes';


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

    public craeteNotes(dn: string[]) {
        const gl = { "domain": dn };
        this.addNote(gl);
        this.domain.updateGroupLabels(dn, { 'common': [] });
    }

    public addNote(gl: GroupLables) {
        const nId = tools.generateSixString();
        this.notes.addNote(nId, gl);
    }

    public deleteNote(nId: string) {
        this.notes.deleteNote(nId);
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
        const eb: IEditBase = this.editor.getEditorObj();
        if (eb.kind === 'EditNote') {
            this.processEditNote(eb);
        } else if (eb.kind === 'EditCommonGroupLabels') {
            this.processEditCommonGroupLabels(eb);
        } else if (eb.kind === 'EditDomain') {
            this.processEditDomain(eb);
        }
        // else if (eb.kind === 'EditNoteDelete') {
        //     this.processEditNoteDelete(eb)
        // }
        else {
            return;
        }
        this.editor.archiveEditor();
    }

    private processEditNote(eb: IEditBase) {
        const eo = eb as IEditNoteData;
        // if (eo.editable.delete) {
        //     this.notes.deleteNote(eo.immutable.nId);
        //     return;
        // }
        const n = this.notes.getNoteById(eo.immutable.nId);
        n.updateDataContents(eo.editable.contents);
        n.updateDataGroupLabels(eo.editable.groupLabels);
        this.notes.permanent();
    }

    private processEditCommonGroupLabels(eb: IEditBase) {
        const eo = eb as IEditNotesCommonGroupLabels;

        const mcgl = groupLabel2ArrayLabels(eo.immutable.commonGroupLabels);
        const ecgl = groupLabel2ArrayLabels(eo.editable.commonGroupLabels);
        const dcgl = groupLabel2ArrayLabels(eo.immutable.domainGroupLabes);

        const notes = this.notes.getNotesByArrayLabels(mcgl.concat(dcgl), true);
        for (const n of notes) {
            const nlabels = n.getDataArrayLabels().filter(l => !mcgl.includes(l)).concat(ecgl).concat(dcgl);
            this.notes.reLabels(n.getId(), nlabels);
        }
    }

    private processEditDomain(eb: IEditBase) {
        const eo = eb as IEditDomain;
        if (eo.editable.delete.notes) {
            this.domain.deleteDomainNotes(eo.immutable.domainNode.split(pathSplit));
        } else if (eo.editable.delete.domainNode) {
            this.domain.deleteDomain(eo.immutable.domainNode.split(pathSplit));
        }
        this.domain.updateGroupLabels(eo.immutable.domainNode.split(pathSplit), eo.editable.commonGroupLabels);
    }

    // private processEditNoteDelete(eb: IEditBase) {
    //     const eo = eb as IEditDeleteNote;
    //     eo.editable.delete && this.notes.deleteNote(eo.immutable.nId)
    // }

    public checkEditorCleaned() {
        return this.editor.checkEditorCleaned();
    }

    public createNoteEditor(nId: string, al: ArrayLabels) {
        if (nId !== '0') {
            const nd = this.notes.getNoteById(nId).getData();
            this.editor.createNoteEditorFile(nId, nd.contents, nd.labels);
            return;
        } else {
            const _nId = tools.generateSixString();
            this.notes.addNote(_nId, arrayLabels2GroupLabel(al));
            const nd = this.notes.getNoteById(_nId).getData();
            this.editor.createNoteEditorFile(_nId, nd.contents, nd.labels);
            return;
        }
    }

    public createDomainEditor(domainNode: string[]) {
        // this.domain.isNotes(domainNode) || this.domain.addDomain(domainNode);
        const gl = this.domain.getGroupLabel(domainNode);
        this.editor.createDomainEditorFile(domainNode, gl);
    }

    public createNotesSetGroupLabelsEditor(domainNode: string[], al: ArrayLabels) {
        const dgl = this.getArrayLabelsOfDomain(domainNode);
        const gl = al.filter(l => !dgl.includes(l));
        this.editor.createNotesSetGroupLabelsEditorFile(domainNode, arrayLabels2GroupLabel(dgl), arrayLabels2GroupLabel(gl));
    }

    // public createNoteDeleteEditor(nId: string) {
    //     const nd = this.notes.getNoteById(nId).getData();
    //     this.editor.createNoteDeleteEditorFile(nId, nd.contents, nd.labels);
    // }

    public clearEditor() {
        this.editor.archiveEditor();
    }

    public getEditorFile() {
        return this.editor.getEditorFile();
    }
}
