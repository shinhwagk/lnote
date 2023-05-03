
import {
    existsSync, mkdirpSync, moveSync, removeSync
} from 'fs-extra';

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
     * domain
     * 
     */
    public getNotesOfDomain(domainNode: string[], strict: boolean = false): LNote[] {
        const als = this.getld().getArrayLabels(domainNode);
        return this.getln().getNotesByAls(als, strict);
    }
}
