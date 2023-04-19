
import {
    existsSync, mkdirpSync
} from 'fs-extra';

import { tools } from '../helper';
import { GroupLables } from '../types';
import { VNBDomain as LDomain } from './domain';

import { NBNote } from './note';
import { groupLabel2ArrayLabels, LNotes } from './notes';

export class LNotebook {
    private readonly domain: LDomain;
    private readonly notes: LNotes;

    constructor(
        private readonly nb: string,
        private readonly dir: string
    ) {
        existsSync(this.dir) || mkdirpSync(this.dir);

        this.domain = new LDomain(this.nb, this.dir);
        this.notes = new LNotes(this.nb, this.dir);
    }

    public getln() {
        return this.notes;
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
        // public craeteNotes(dn: string[],) {
        //     this.addNote(["common->default"]);
        //     this.domain.updateGroupLabels(dn, { 'common': ['default'] });
        // }
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


    public search(keywords: string[]): NBNote[] {
        const notes: NBNote[] = [];
        const res = keywords.map(kw => new RegExp(kw));
        for (const [nId, note] of this.notes.getCache().entries()) {
            const contentOfNote = note.contents.concat(Object.values(note.labels).flatMap(l => l)).filter(c => c.length >= 1);
            if (res.filter(re => re.test(contentOfNote.join("   "))).length === keywords.length) {
                const n = new NBNote(this.nb, this.dir, nId, note);
                notes.push(n);
            }
        }
        return notes;
    }

    public getNotes(domainNode: string[]): NBNote[] {
        const al = this.getArrayLabelsOfDomain(domainNode);
        return this.getNotesByArrayLabels(al);
    }
}
