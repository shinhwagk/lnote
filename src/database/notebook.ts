
import {
    existsSync, mkdirpSync
} from 'fs-extra';

import { ArrayLabels, GroupLables } from '../types';
import { VNBDomain as LDomain } from './domain';

import { LNote } from './note';
import { arrayLabels2GroupLabel as arrayLabels2GroupLabels, groupLabels2ArrayLabels, LNotes } from './notes';

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
    public getNotesByArrayLabels(al: string[], strict: boolean = false) {
        return this.lnotes.getNotesByArrayLabels(al, strict);
    }

    public craeteNotes(dn: string[]) {
        const gls = { "domain": dn };
        this.addNoteByGls(gls);
        this.ldomain.updateGroupLabels(dn, gls);
        // public craeteNotes(dn: string[],) {
        //     this.addNote(["common->default"]);
        //     this.domain.updateGroupLabels(dn, { 'common': ['default'] });
        // }
    }

    public addNoteByGls(gls: GroupLables) {
        this.lnotes.add(gls);
    }

    public addNoteByAls(als: ArrayLabels) {
        this.addNoteByGls(arrayLabels2GroupLabels(als));
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

    public isNotesOfDomain(domainNode: string[]) {
        return this.ldomain.isNotes(domainNode);
    }

    public getDomainByDomainNode(dn: string[]) {
        return this.ldomain.getDomain(dn);
    }

    public addDomain(dn: string[]) {
        this.ldomain.create(dn);
    }

    public renameDomain(dn: string[], domainName: string) {
        this.ldomain.renameDomain(dn, domainName);
    }

    public removeDomain(dn: string[]) {
        this.ldomain.remove(dn);
    }

    public removeNotesOfDomain(domainNode: string[]): void {
        this.ldomain.deleteDomainNotes(domainNode);
    }

    public setGroupLabelsOfDomain(dn: string[], name: string, gls: GroupLables) {
        this.ldomain.updateGroupLabels(dn, gls);
        this.ldomain.renameDomain(dn, name);
    }

    public getArrayLabelsOfDomain(dn: string[]) {
        return groupLabels2ArrayLabels(this.getGroupLabelsOfDomain(dn));
    }

    public getGroupLabelsOfDomain(dn: string[]) {
        return this.ldomain.getGroupLabels(dn);
    }

    public search(keywords: string[]): LNote[] {
        const notes: LNote[] = [];
        const res = keywords.map(kw => new RegExp(kw));
        for (const note of this.lnotes.getCache().values()) {
            const contentOfNote = note.contents.concat(Object.values(note.gls).flatMap(l => l)).filter(c => c.length >= 1);
            if (res.filter(re => re.test(contentOfNote.join("   "))).length === keywords.length) {
                notes.push(note);
            }
        }
        return notes;
    }

    public getNotesOfDomain(domainNode: string[]): LNote[] {
        const al = this.getArrayLabelsOfDomain(domainNode);
        return this.getNotesByArrayLabels(al);
    }
}
