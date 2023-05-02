import * as path from 'path';

import {
    existsSync, mkdirpSync, readdirSync, removeSync, statSync
} from 'fs-extra';

import { LNote } from './note';
import { LNotebook } from './notebook';
import { IEditNoteData1, LEditor } from './editor';
import { tools } from '../helper';
import { ArrayLabels, GroupLables, NoteId } from '../types';
import { arrayLabels2GroupLabel, groupLabels2ArrayLabels } from './notes';
import { jointMark, nbGroup } from '../constants';

export class LNotebooks {
    private readonly nbs = new Map<string, LNotebook>();

    readonly editor: LEditor;

    constructor(private readonly masterPath: string) {
        existsSync(this.masterPath) || mkdirpSync(this.masterPath);

        this.editor = new LEditor(masterPath);

        const _s = (new Date()).getTime();
        this.refresh();
        console.log(`lnotes: cache notebooks success, time: ${new Date().getTime() - _s} ms.`);
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
        this.cache(nb);
    }

    public remove(nb: string) {
        this.nbs.delete(nb);
        removeSync(path.join(this.getDir(nb)));
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

    public processEditor() {
        console.log(this.editor.curEditor, 'noteslabels11');
        switch (this.editor.curEditor) {
            case 'note':
                this.processEditNote();
                break;
            case 'notesgls':
                this.processEditNotesGroupLabels();
                break;
            case 'domain':
                this.processEditDomain();
                break;
            default:
                console.log("non.");
        }
    }

    // public processEditEnv() {
    //     const eb: IEditBase = this.editor.getEditorObj();
    //     if (eb.kind === 'EditNote') {
    //         this.processEditNote(eb);
    //     } else if (eb.kind === 'EditCommonGroupLabels') {
    //         // this.processEditCommonGroupLabels(eb);
    //     } else if (eb.kind === 'EditDomain') {
    //         // this.processEditDomain(eb);
    //     }
    //     // else if (eb.kind === 'EditNoteDelete') {
    //     //     this.processEditNoteDelete(eb)
    //     // }
    //     else {
    //         return;
    //     }
    //     // this.editor.archiveEditor();
    // }

    private processEditNote() {
        const en = tools.readYamlSync(this.getEditorFile()) as IEditNoteData1;
        const lnb = this.get(en.nb);
        const n = lnb.getNoteById(en.id);
        n.updateContents(en.contents);
        n.updateGroupLabels(en.gls);
        lnb.getln().permanent();
    }

    private processEditNotesGroupLabels() {
        const e = tools.readYamlSync(this.getEditorFile()) as { ids: NoteId[], gls: GroupLables };
        const als = groupLabels2ArrayLabels(e.gls);
        const nb = als[0].split(jointMark)[1];
        for (const id of e.ids) {
            this.get(nb).getNoteById(id).updateGroupLabels(e.gls);
        }
        this.get(nb).getln().permanent();
    }

    private processEditDomain() {
        const e = tools.readYamlSync(this.getEditorFile()) as { dn: string[], name: string, gls?: GroupLables };
        if (e.gls) {
            this.get(e.dn[0]).setGroupLabelsOfDomain(e.dn, e.name, e.gls);
        } else {
            this.get(e.dn[0]).removeNotesOfDomain(e.dn);
        }
    }

    public createNoteEditor(nb: string, id: NoteId) {
        this.editor.curEditor = 'note';
        const nd = this.get(nb).getNoteById(id);
        this.editor.createNoteEditor(nb, id, nd.getGls(), nd.getContents());
    }

    public createNotesGroupLabelsEditor(als: ArrayLabels) {
        const nbl = als.filter(al => al.startsWith(`${nbGroup}${jointMark}'`));
        this.editor.curEditor = 'notesgls';
        if (nbl.length >= 1) {
            const nb = nbl[0].split(jointMark)[1];
            const notes = this.get(nb).getNotesByArrayLabels(als, true);
            this.editor.createNotesGroupLabelsEditor({ nb: nb, ids: notes.map(n => n.getId()), gls: arrayLabels2GroupLabel(als) });
        }
    }

    public createDomainEditor(dn: string[]) {
        this.editor.curEditor = 'domain';
        if (this.get(dn[0]).isNotesOfDomain(dn)) {
            this.editor.createDomainEditor(dn, this.get(dn[0]).getGroupLabelsOfDomain(dn));
        } else {
            this.editor.createDomainEditor(dn, undefined);
        }
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


}