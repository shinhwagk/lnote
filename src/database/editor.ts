import * as path from 'path';

import { existsSync, mkdirpSync, moveSync, removeSync } from 'fs-extra';
import { section } from '../constants';
import { tools } from '../helper';
import { GroupLables } from '../types';

export interface IEditBase {
    kind: 'EditCommonGroupLabels' | 'EditNote' | 'EditNoteDelete' | 'EditDomain' | 'None';
}

// export interface IEditDeleteNote extends IEditBase {
//     kind: 'EditNoteDelete';
//     immutable: {
//         nbName: string,
//         nId: string,
//         groupLabels: GroupLables,
//         contents: string[]
//     },
//     editable: {
//         delete: boolean
//     }
// }

export interface IEditNoteData1 {
    nb: string,
    id: string,
    gls: GroupLables,
    contents: string[]
}

export interface IEditNoteData2 {
    nb: string,
    ids: string[],
    gls: GroupLables,
}

export interface IEditNoteData {
    // delete: boolean,
    nb: string,
    id: string,
    gls: GroupLables,
    contents: string[]
}

export interface IEditNotesLabels {
    // delete: boolean,
    nb: string,
    ids: string[],
    gls: GroupLables,
}

export interface IEditNotesCommonGroupLabels extends IEditBase {
    kind: 'EditCommonGroupLabels';
    immutable: {
        nBName: string,
        domainNode: string[],
        domainGroupLabes: GroupLables
        commonGroupLabels: GroupLables
    },
    editable: {
        commonGroupLabels: GroupLables
    }

}

export interface IEditDomain extends IEditBase {
    kind: 'EditDomain';
    immutable: {
        nbName: string,
        domainNode: string,
        notes: boolean,
        commonGroupLabels: GroupLables
    },
    editable: {
        // delete: {
        //     notes: boolean,
        //     domainNode: boolean
        // }
        domainName: string,
        commonGroupLabels: GroupLables,
        orderBy?: {
            notesGroupLabels?: GroupLables
        }
    }
}


type IEditor = 'note' | 'notesgls' | 'domain';

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

    public createNoteEditor(nb: string, id: string, gls: GroupLables, contents: string[]) {
        const ed: IEditNoteData1 = {
            nb: nb,
            id: id,
            gls: gls,
            contents: contents
        };
        tools.writeYamlSync(this.getEditorPreviousVersionFile(), ed);
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    public createNotesGroupLabelsEditor(ps: { nb: string, ids: string[], gls: GroupLables }) {
        const ed: IEditNoteData2 = {
            nb: ps.nb,
            ids: ps.ids,
            gls: ps.gls
        };
        tools.writeYamlSync(this.getEditorPreviousVersionFile(), ed);
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    public createDomainEditor(dn: string[], gls?: GroupLables) {
        const ed = gls ? {
            dn: dn,
            name: dn[dn.length - 1],
            gls: gls
        } : {
            dn: dn,
            name: dn[dn.length - 1]
        };
        tools.writeYamlSync(this.getEditorPreviousVersionFile(), ed);
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    public archiveEditor() {
        const aef = {
            source: tools.readYamlSync(this.getEditorPreviousVersionFile()),
            target: tools.readYamlSync(this.getEditorFile())
        };

        const ts = tools.formatDate(new Date());
        const archiveFile = path.join(this.editArchiveDir, `${ts}.${this.curEditor}.yml`);
        tools.writeYamlSync(archiveFile, aef);
        removeSync(this.getEditorFile());
        removeSync(this.getEditorPreviousVersionFile());
    }

}
