import * as path from 'path';

import { existsSync, mkdirpSync, removeSync } from 'fs-extra';
import { section } from '../constants';
import { tools } from '../helper';
import { GroupLables, IEditNote, IEditNotesGls, IEditor } from '../types';

export class LEditor {
    public readonly editDir: string;
    // public readonly editorFile: string;
    public readonly editArchiveDir: string;
    public curEditor: IEditor = 'note';

    constructor(
        private readonly dir: string
    ) {
        this.editDir = path.join(this.dir, '.editor');
        existsSync(this.editDir) || mkdirpSync(this.editDir);

        this.editArchiveDir = path.join(this.editDir, 'archives');
        existsSync(this.editArchiveDir) || mkdirpSync(this.editArchiveDir);
    }

    public getEditorFile = () => path.join(this.editDir, `${section}-${this.curEditor}.yml`);
    public getEditorPreviousVersionFile = () => path.join(this.editDir, `${section}-${this.curEditor}-pv.yml`);

    public checkEditorFile = () => existsSync(this.getEditorFile());

    public trySetEditor(ekind: IEditor) {
        this.curEditor = ekind;
        return this.checkEditorFile();
    }

    public createNoteEditor(nb: string, id: string, gls: GroupLables, contents: string[]) {
        const ed: IEditNote = {
            nb: nb,
            id: id,
            gls: gls,
            contents: contents
        };
        tools.writeYamlSync(this.getEditorPreviousVersionFile(), ed);
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    public createNotesGlsEditor(ps: { nb: string, ids: string[], gls: GroupLables }) {
        const ed: IEditNotesGls = {
            nb: ps.nb,
            ids: ps.ids,
            gls: ps.gls
        };
        tools.writeYamlSync(this.getEditorPreviousVersionFile(), ed);
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    public createDomainEditor(dn: string[], gls?: GroupLables) {
        const ed = {
            dn: dn,
            gls: gls
        };
        tools.writeYamlSync(this.getEditorPreviousVersionFile(), ed);
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    public archiveEditor() {
        if (!tools.checkFileSame(this.getEditorPreviousVersionFile(), this.getEditorFile())) {
            const ts = tools.formatDate(new Date());
            const aef = {
                previous: tools.readYamlSync(this.getEditorPreviousVersionFile()),
                modified: tools.readYamlSync(this.getEditorFile()),
                timestamp: ts
            };
            const archiveFile = path.join(this.editArchiveDir, `${ts}.${this.curEditor}.yml`);
            tools.writeYamlSync(archiveFile, aef);
        }
        removeSync(this.getEditorFile());
        removeSync(this.getEditorPreviousVersionFile());
    }
}
