import * as path from 'path';

import {
    existsSync, mkdirpSync, readdirSync, statSync
} from 'fs-extra';

import { LNote } from './note';
import { LNotebook } from './notebook';
import { IEditBase, IEditNoteData, IEditNoteData1, LEditor } from './editor';
import { tools } from '../helper';
import { GroupLables } from '../types';

export class LNotebooks {
    private readonly nbs = new Map<string, LNotebook>();

    readonly editor: LEditor;

    constructor(private readonly masterPath: string) {
        existsSync(this.masterPath) || mkdirpSync(this.masterPath);

        this.editor = new LEditor(masterPath);

        const s = (new Date()).getTime();
        this.refresh();
        console.log(`cache notebooks success, time: ${new Date().getTime() - s} ms.`);
    }

    public refresh(nb: string | undefined = undefined): void {
        if (nb === undefined) {
            this.nbs.clear();
            this.cacheAll();
        } else {
            this.cache(nb);
        }
    }

    private cacheAll() {
        for (const nb of readdirSync(this.masterPath)
            .filter(f => statSync(this.getDir(f)).isDirectory())
            .filter(f => f !== '.editor')) {
            try {
                this.cache(nb);
            } catch (e) {
                console.error(`nb: ${nb}.err: ${e}`);
            }
        }
    }

    private cache(nb: string) {
        this.nbs.set(nb, new LNotebook(nb, this.getDir(nb)));
    }

    public create(nb: string) {
        mkdirpSync(this.getDir(nb));
        this.cache(nb);
    }

    private getDir(nb: string) {
        return path.join(this.masterPath, nb);
    }

    public get(nb: string): LNotebook {
        return this.nbs.get(nb)!;
    }

    public getNames(): string[] {
        return Array.from(this.nbs.keys());
    }

    public search(keywords: string[]): LNote[] {
        return Array.from(this.nbs.entries()).map(([n, nb]) => {
            if (keywords.includes(n)) {
                const _kws = keywords.filter(kw => kw !== n);
                return nb.search(_kws);
            }
            return [];
        }).flatMap(n => n);
    }

    // public getNotesNumberUnderDomain(domainNode: string[], cnt: number = 0): number {
    //     cnt += this.getNotesNumberOfDomain(domainNode);
    //     const nbDomain = objectPath.get(this.domainCache, domainNode);
    //     const domainNames = Object.keys(nbDomain).filter(d => d !== '.labels');
    //     if (domainNames.length === 0) {
    //         return cnt;
    //     }

    //     let _cnt = 0;
    //     for (const d of domainNames) {
    //         _cnt += this.getNotesNumberUnderDomain(domainNode.concat(d));
    //     }
    //     return _cnt;
    // }

    // public getNotesNumberOfDomain(domainNode: string[]): number {
    //     const categories = objectPath.get(this.domainCache, [...domainNode, '.labels'], {});
    //     return Object.values(categories).flat().length;
    // }

    // public createCategory(domainNode: string[], cname: string, labels: string[]) {
    //   objectPath.ensureExists(this.domainTreeCache, [...domainNode, '.categories', cname], labels);
    //   this.writeNBDomains(domainNode[0]);
    // }




    // public getNotesByLabels(nb: string, labels: string[]): any[] {
    //     const nIds = labels
    //         .map(l => { return Array.from(this.nbNotesLabelsCache.get(nbName)?.get(l)?.values() || []); })
    //         .reduce((p, c) => tools.intersections(p, c),
    //             Array.from(this.nbNotesLabelsCache.get(nbName)?.get(labels[0])?.values() || [])
    //         );
    //     return nIds.map(nId => {
    //         const note = this.nbNotesCache.get(nbName)![0][nId] as any;
    //         note['nId'] = nId;
    //         note['doc'] = this.checkDocExist(nbName, nId);
    //         note['files'] = this.checkFilesExist(nbName, nId);
    //         return note;
    //     });
    // }

    // public getNotesOfDomain(domainNode: string[]): NBNoteStruct[] {
    //     const nbName = domainNode[0];
    //     const { domain, notes } = this.getNB(nbName)!;
    //     const labelsOfDomain = domain.getLabelsOfDomain(domainNode);
    //     return notes.getNotesByLabels(labelsOfDomain);
    // }


    /**
     * 
     * edit
     * 
     */
    public processEditorNote() {
        const en = tools.readYamlSync(this.getEditorFile1()) as IEditNoteData1;
        const lnb = this.get(en.nb);
        const n = lnb.getNoteById(en.nid);
        // n.getNoteById(eo.immutable.nId);
        n.updateDataContents(en.contents);
        n.updateDataGroupLabels(en.gls);
        lnb.getln().permanent();
    }

    public processEditEnv() {
        const eb: IEditBase = this.editor.getEditorObj();
        if (eb.kind === 'EditNote') {
            this.processEditNote(eb);
        } else if (eb.kind === 'EditCommonGroupLabels') {
            // this.processEditCommonGroupLabels(eb);
        } else if (eb.kind === 'EditDomain') {
            // this.processEditDomain(eb);
        }
        // else if (eb.kind === 'EditNoteDelete') {
        //     this.processEditNoteDelete(eb)
        // }
        else {
            return;
        }
        // this.editor.archiveEditor();
    }

    private processEditNote(eb: IEditBase) {
        const eo = eb as IEditNoteData;
        const lnb = this.get(eo.immutable.nb);
        const n = lnb.getNoteById(eo.immutable.nId);
        // n.getNoteById(eo.immutable.nId);
        n.updateDataContents(eo.editable.contents);
        n.updateDataGroupLabels(eo.editable.groupLabels);
        lnb.getln().permanent();
    }

    // private processEditCommonGroupLabels(eb: IEditBase) {
    //     const eo = eb as IEditNotesCommonGroupLabels;

    //     const mcgl = groupLabel2ArrayLabels(eo.immutable.commonGroupLabels);
    //     const ecgl = groupLabel2ArrayLabels(eo.editable.commonGroupLabels);
    //     const dcgl = groupLabel2ArrayLabels(eo.immutable.domainGroupLabes);

    //     const notes = this.notes.getNotesByArrayLabels(mcgl.concat(dcgl), true);
    //     for (const n of notes) {
    //         const nlabels = n.getDataArrayLabels().filter(l => !mcgl.includes(l)).concat(ecgl).concat(dcgl);
    //         this.notes.reLabels(n.getId(), nlabels);
    //     }
    // }

    // private processEditDomain(eb: IEditBase) {
    //     const eo = eb as IEditDomain;
    //     // if (eo.editable.delete.notes) {
    //     //     this.domain.deleteDomainNotes(eo.immutable.domainNode.split(pathSplit));
    //     // } else if (eo.editable.delete.domainNode) {
    //     //     this.domain.deleteDomain(eo.immutable.domainNode.split(pathSplit));
    //     // }
    //     this.domain.updateGroupLabels(eo.immutable.domainNode.split(pathSplit), eo.editable.commonGroupLabels);
    // }

    // private processEditNoteDelete(eb: IEditBase) {
    //     const eo = eb as IEditDeleteNote;
    //     eo.editable.delete && this.notes.deleteNote(eo.immutable.nId)
    // }

    public checkEditorCleaned() {
        return this.editor.checkEditorCleaned();
    }

    public createNoteEditor(nb: string, nId: string,) {
        const nd = this.get(nb).getNoteById(nId).getData();
        this.editor.createNoteEditorFile1(nb, nId, nd.contents, nd.labels);
        // if (nId !== '0') {

        //     return;
        // } else {
        //     const _nId = tools.generateSixString();
        //     this.notes.addNote(_nId, arrayLabels2GroupLabel(al));
        //     const nd = this.notes.getNoteById(_nId).getData();
        //     this.editor.createNoteEditorFile(_nId, nd.contents, nd.labels);
        //     return;
        // }
    }

    // public createDomainEditor(domainNode: string[]) {
    //     this.domain.isNotes(domainNode) || this.domain.addDomain(domainNode);
    //     const gl = this.domain.getGroupLabel(domainNode);
    //     const isNotes = this.domain.isNotes(domainNode);
    //     this.editor.createDomainEditorFile(domainNode, isNotes, gl);
    // }

    // public createNotesSetGroupLabelsEditor(domainNode: string[], al: ArrayLabels) {
    //     const dgl = this.getArrayLabelsOfDomain(domainNode);
    //     const gl = al.filter(l => !dgl.includes(l));
    //     this.editor.createNotesSetGroupLabelsEditorFile(domainNode, arrayLabels2GroupLabel(dgl), arrayLabels2GroupLabel(gl));
    // }

    // public createNoteDeleteEditor(nId: string) {
    //     const nd = this.notes.getNoteById(nId).getData();
    //     this.editor.createNoteDeleteEditorFile(nId, nd.contents, nd.labels);
    // }

    // public clearEditor() {
    //     this.editor.archiveEditor();
    // }

    public getEditorFile() {
        return this.editor.getEditorFile();
    }

    public getEditorFile1() {
        return this.editor.getEditorFile1();
    }
}