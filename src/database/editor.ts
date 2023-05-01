import * as path from 'path';

import { existsSync, mkdirpSync, moveSync } from 'fs-extra';
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

        // this.editorFile = path.join(this.editDir, `${section}@editor.yml`);
        // existsSync(this.editorFile) || vfs.writeFileSync(this.editorFile, '');

        this.editArchiveDir = path.join(this.editDir, 'archives');
        existsSync(this.editArchiveDir) || mkdirpSync(this.editArchiveDir);
    }

    // public getEditorFile = () => this.editorFile;

    // public getEditorObj = () => tools.readYamlSync(this.editorFile) as IEditBase;

    public getEditorFile = () => path.join(this.editDir, `${section}-${this.curEditor}.yml`);

    public checkEditorFile = () => existsSync(this.getEditorFile());

    public createNoteEditor(nb: string, id: string, gls: GroupLables, contents: string[]) {
        const ed: IEditNoteData1 = {
            nb: nb,
            id: id,
            gls: gls,
            contents: contents
        };
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    public createNotesGroupLabelsEditor(ps: { nb: string, ids: string[], gls: GroupLables }) {
        const ed: IEditNoteData2 = {
            nb: ps.nb,
            ids: ps.ids,
            gls: ps.gls
        };
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
        }
        tools.writeYamlSync(this.getEditorFile(), ed);
    }

    // public createNoteEditorFile(nb: string, nId: string, contents: string[], gl: GroupLables) {
    //     const ed: IEditNoteData = {
    //         kind: 'EditNote',
    //         immutable: {
    //             nb: nb,
    //             nId: nId,
    //             groupLabels: gl,
    //             contents: contents
    //         },
    //         editable: {
    //             // delete: false,
    //             groupLabels: gl,
    //             contents: contents,
    //         }
    //     };
    //     tools.writeYamlSync(this.editorFile, ed);
    // }

    // public createDomainEditorFile(domainNode: string[], notes: boolean, gl: GroupLables) {
    //     const ed: IEditDomain = {
    //         kind: 'EditDomain',
    //         immutable: {
    //             nbName: domainNode[0],
    //             domainNode: domainNode.join(pathSplit),
    //             notes: notes,
    //             commonGroupLabels: gl
    //         },
    //         editable: {
    //             // delete: {
    //             //     notes: false,
    //             //     domainNode: false
    //             // },
    //             domainName: domainNode[domainNode.length - 1],
    //             commonGroupLabels: gl
    //         }
    //     };
    //     tools.writeYamlSync(this.editorFile, ed);
    // }

    // public createNotesSetGroupLabelsEditorFile(domainNode: string[], dgl: GroupLables, gl: GroupLables) {
    //     const ed = {
    //         kind: 'EditCommonGroupLabels',
    //         immutable: {
    //             nbName: domainNode[0],
    //             domainNode: domainNode.join(pathSplit),
    //             domainGroupLabes: dgl,
    //             commonGroupLabels: gl
    //         },
    //         editable: {
    //             commonGroupLabels: gl
    //         }
    //     };
    //     tools.writeYamlSync(this.editorFile, ed);
    // }

    // public checkEditorCleaned() {
    //     return statSync(this.editorFile).size === 0;
    // }

    public archiveEditor() {
        const ts = tools.formatDate(new Date());
        const archiveFile = path.join(this.editArchiveDir, `${ts}.${this.curEditor}.yml`);
        moveSync(this.getEditorFile(), archiveFile);
    }

    // public archiveEditor1(editorFile: string) {
    //     const ts = tools.formatDate(new Date());
    //     const e: IEditBase = tools.readYamlSync(this.editorFile);
    //     const k = e.kind.toLocaleLowerCase();
    //     const archiveFile = path.join(this.editArchiveDir, `${ts}.${k}.yml`);
    //     moveSync(editorFile, archiveFile);
    // }


}
