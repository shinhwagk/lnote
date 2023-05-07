import * as path from 'path';

import { existsSync, mkdirpSync, removeSync } from 'fs-extra';
import { section } from '../constants';
import { tools } from '../helper';
import { GroupLables, IEditNote, IEditNotesGls, IEditor } from '../types';

export class LEditor {
    public readonly editDir: string;
    // public readonly editorFile: string;
    public curEditor: IEditor = 'note';

    constructor(
        private readonly dir: string
    ) {
        this.editDir = path.join(this.dir, '.editor');
        existsSync(this.editDir) || mkdirpSync(this.editDir);
    }

    public getEditorFile = () => path.join(this.editDir, `${section}-${this.curEditor}.yml`);

    public checkEditorFile = () => existsSync(this.getEditorFile());

    public clearEditorFile = () => removeSync(this.getEditorFile());

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
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    public createNotesGlsEditor(nb: string, ids: string[], gls: GroupLables) {
        const ed: IEditNotesGls = {
            nb: nb,
            ids: ids,
            gls: gls
        };
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    public createDomainEditor(dn: string[], gls?: GroupLables) {
        const ed = {
            dn: dn,
            gls: gls
        };
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

}
