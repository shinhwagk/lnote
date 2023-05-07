import * as path from 'path';

import {
    copySync,
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
        for (const nb of this.getNames()) {
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
        this.trash(nb);
        this.nbs.delete(nb);
    }

    public trash(nb: string) {
        const ts = tools.formatDate(new Date());
        moveSync(this.getDir(nb), path.join(this.masterPath, '.trash', `${ts}-${nb}`), { overwrite: true });
    }

    private getDir(nb: string) {
        return path.join(this.masterPath, nb);
    }

    public get(nb: string): LNotebook {
        return this.nbs.get(nb)!;
    }

    public rename(nb: string, nnb: string) {
        if (!existsSync(this.getDir(nnb))) {
            copySync(this.getDir(nb), this.getDir(nnb));
            this.trash(nb);
            this.cache(nnb);
        }
    }

    public getNames(): string[] {
        return readdirSync(this.masterPath)
            .filter(f => !['.editor', '.trash'].includes(f))
            .filter(f => statSync(this.getDir(f)).isDirectory());
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
        lnb.getln().permanent();
    }

    private processEditNotesGroupLabels() {
        const e = tools.readYamlSync(this.editor.getEditorFile()) as { nb: string, ids: NoteId[], gls: GroupLables };
        const nb = e.nb;
        for (const id of e.ids) {
            this.get(nb).getln().getById(id).updateGroupLabels(e.gls);
        }
        this.get(nb).getln().permanent();
    }

    private processEditDomain() {
        const e = tools.readYamlSync(this.editor.getEditorFile()) as { dn: string[], gls?: GroupLables };
        if (e.gls) {
            this.get(e.dn[0]).getld().updateGls(e.dn, e.gls);
        } else {
            this.get(e.dn[0]).getld().deleteNotes(e.dn);
        }
        this.cache(e.dn[0]);
    }

    public createNoteEditor(nb: string, id: NoteId) {
        if (!this.editor.trySetEditor('note')) {
            const nd = this.get(nb).getln().getById(id);
            this.editor.createNoteEditor(nb, id, nd.gls, nd.contents);
        }
    }

    public createNotesGlsEditor(als: ArrayLabels) {
        if (!this.editor.trySetEditor('notesgls')) {
            const gls = arrayLabels2GroupLabels(als);
            const nbg = gls[nbGroup];
            if (nbg) {
                const nb = nbg[0];
                const notes = this.get(nb).getln().getNotesByAls(als, true);
                this.editor.createNotesGlsEditor(nb, notes.map(n => n.id), arrayLabels2GroupLabels(als));
            }
        }
    }

    public createDomainGlsEditor(dn: string[]) {
        if (!this.editor.trySetEditor('domaingls')) {
            this.editor.createDomainEditor(dn, this.get(dn[0]).getld().getGroupLabels(dn));
        }
    }
}