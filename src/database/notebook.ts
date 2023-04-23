
import {
    existsSync, mkdirpSync
} from 'fs-extra';

import { tools } from '../helper';
import { ArrayLabels, GroupLables } from '../types';
import { VNBDomain as LDomain } from './domain';

import { LNote } from './note';
import { arrayLabels2GroupLabel, groupLabel2ArrayLabels, LNotes } from './notes';

export class LNotebook {
    private readonly ldomain: LDomain;
    private readonly lnotes: LNotes;

    constructor(
        private readonly nb: string,
        private readonly dir: string
    ) {
        existsSync(this.dir) || mkdirpSync(this.dir);

        this.ldomain = new LDomain(this.nb, this.dir);
        this.lnotes = new LNotes(this.nb, this.dir);
    }

    public getln() {
        return this.lnotes;
    }

    /**
     * 
     * notes & note
     * 
     */
    public getNotesByArrayLabels(al: string[]) {
        return this.lnotes.getNotesByArrayLabels(al, false);
    }

    public craeteNotes(dn: string[]) {
        const gls = { "domain": dn };
        this.addNote(gls);
        this.ldomain.updateGroupLabels(dn, gls);
        // public craeteNotes(dn: string[],) {
        //     this.addNote(["common->default"]);
        //     this.domain.updateGroupLabels(dn, { 'common': ['default'] });
        // }
    }

    public addNote(gl: GroupLables) {
        const nId = tools.generateSixString();
        this.lnotes.addNote(nId, gl);
    }
    public addNoteByAl(gl: ArrayLabels) {
        const nId = tools.generateSixString();
        this.lnotes.addNote(nId, arrayLabels2GroupLabel(gl));
    }

    public deleteNote(nId: string) {
        this.lnotes.deleteNote(nId);
    }

    public getNoteById(nId: string) {
        return this.lnotes.getNoteById(nId);
    }

    public getNodeFilePath(nId: string) {
        return this.lnotes.getNoteById(nId).getFilesPath();
    }

    /**
     * 
     * domain
     * 
     */
    public getChildrenNameOfDomain(domainNode: string[] = []): string[] {
        return this.ldomain.getChildrenNameOfDomain(domainNode);
    }

    public checkDomainIsNotes(domainNode: string[]) {
        return this.ldomain.isNotes(domainNode);
    }

    public getDomainByNode(dn: string[]) {
        return this.ldomain.getDomain(dn);
    }

    public addDomain(dn: string[]) {
        this.ldomain.add(dn);
    }

    public deleteDomain(dn: string[]) {
        this.ldomain.deleteDomain(dn);
    }

    public renameDomain(dn: string[], domainName: string) {
        this.ldomain.renameDomain(dn, domainName);
    }

    public getArrayLabelsOfDomain(dn: string[]) {
        return groupLabel2ArrayLabels(this.getGroupLabelOfDomain(dn));
    }

    public getGroupLabelOfDomain(dn: string[]) {
        return this.ldomain.getGroupLabel(dn);
    }

    public search(keywords: string[]): LNote[] {
        const notes: LNote[] = [];
        const res = keywords.map(kw => new RegExp(kw));
        for (const [nId, note] of this.lnotes.getCache().entries()) {
            const contentOfNote = note.contents.concat(Object.values(note.labels).flatMap(l => l)).filter(c => c.length >= 1);
            if (res.filter(re => re.test(contentOfNote.join("   "))).length === keywords.length) {
                // n.getData().labels['##nb'] = [n.getnb()];
                notes.push(new LNote(this.nb, this.dir, nId, note));
            }
        }
        return notes;
    }

    public getNotes(domainNode: string[]): LNote[] {
        const al = this.getArrayLabelsOfDomain(domainNode);
        return this.getNotesByArrayLabels(al);
    }
}
