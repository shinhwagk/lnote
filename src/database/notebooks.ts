import * as path from 'path';

import {
    existsSync, mkdirpSync, moveSync, readdirSync, statSync
} from 'fs-extra';

import { jointMark, nbGroup } from '../constants';
import { arrayLabels2GroupLabels, groupLabels2ArrayLabels, tools } from '../helper';
import { ArrayLabels, GroupLables, IEditNote, NoteId } from '../types';
import { LEditor } from './editor';
import { LNote } from './note';
import { LNotebook } from './notebook';

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

    public create = this.cache;

    public remove(nb: string) {
        this.destroy(nb);
        this.nbs.delete(nb);
    }

    public destroy(nb: string) {
        moveSync(this.getDir(nb), path.join(this.masterPath, '.trash', nb))
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
                return nb.getln().search(_kws);
            }
            return [];
        }).flatMap(n => n);
    }

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
            case 'domaingls':
                this.processEditDomain();
                break;
            default:
                console.log("non.");
        }
    }

    private processEditNote() {
        const en = tools.readYamlSync(this.editor.getEditorFile()) as IEditNote;
        const lnb = this.get(en.nb);
        const n = lnb.getln().getById(en.id);
        n.updateContents(en.contents);
        n.updateGroupLabels(en.gls);
        n.updateMts();
        lnb.getln().permanent();
    }

    private processEditNotesGroupLabels() {
        const e = tools.readYamlSync(this.editor.getEditorFile()) as { ids: NoteId[], gls: GroupLables };
        const als = groupLabels2ArrayLabels(e.gls);
        const nb = als[0].split(jointMark)[1];
        for (const id of e.ids) {
            this.get(nb).getln().getById(id).updateGroupLabels(e.gls);
        }
        this.get(nb).getln().permanent();
    }

    private processEditDomain() {
        const e = tools.readYamlSync(this.editor.getEditorFile()) as { dn: string[], gls?: GroupLables };
        if (e.gls) {
            this.get(e.dn[0]).getld().updateGroupLabels(e.dn, e.gls);
        } else {
            this.get(e.dn[0]).getld().deleteDomainNotes(e.dn);
        }
        this.cache(e.dn[0]);
    }

    public createNoteEditor(nb: string, id: NoteId) {
        const nd = this.get(nb).getln().getById(id);
        this.editor.createNoteEditor(nb, id, nd.getGls(), nd.getContents());
    }

    public createNotesGroupLabelsEditor(als: ArrayLabels) {
        const nbl = als.filter(al => al.startsWith(`${nbGroup}${jointMark}`));
        if (this.editor.trySetEditor('notesgls')) {
            return;
        }
        if (nbl.length >= 1) {
            const nb = nbl[0].split(jointMark)[1];
            const notes = this.get(nb).getln().getNotesByAls(als, true);
            this.editor.createNotesGlsEditor({ nb: nb, ids: notes.map(n => n.getId()), gls: arrayLabels2GroupLabels(als) });
        }
    }

    public createDomainGlsEditor(dn: string[]) {
        if (this.editor.trySetEditor('domaingls')) {
            return;
        }
        this.editor.createDomainEditor(dn, this.get(dn[0]).getld().getGroupLabels(dn));
    }
}