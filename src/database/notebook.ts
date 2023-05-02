
import {
    existsSync, mkdirpSync
} from 'fs-extra';
import { arrayLabels2GroupLabels, groupLabels2ArrayLabels } from '../helper';

import { ArrayLabels, GroupLables } from '../types';
import { VNBDomain as LDomain } from './domain';

import { LNote } from './note';
import { LNotes } from './notes';

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

    public getld() {
        return this.ldomain;
    }

    /**
     * 
     * notes & note
     * 
     */

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
        this.lnotes.create(gls);
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
    public getNotesOfDomain(domainNode: string[], strict: boolean = false): LNote[] {
        const als = this.getld().getArrayLabels(domainNode);
        return this.getln().getNotesByAls(als, strict);
    }
}
