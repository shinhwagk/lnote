import { statSync } from 'fs';
import * as path from 'path';

import { existsSync, mkdirpSync, moveSync } from 'fs-extra';
import { pathSplit, section } from '../constants';
import { tools, vfs } from '../helper';
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

export interface IEditNoteData extends IEditBase {
    kind: 'EditNote';
    immutable: {
        nbName: string,
        nId: string,
        groupLabels: GroupLables,
        contents: string[]
    },
    editable: {
        delete: boolean,
        groupLabels: GroupLables,
        contents: string[]
    }
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
        commonGroupLabels: GroupLables
    },
    editable: {
        delete: {
            notes: boolean,
            domainNode: boolean
        }
        domainName: string,
        commonGroupLabels: GroupLables
    }
}


export class VNBEditor {
    public readonly editDir: string;
    public readonly editorFile: string;
    public readonly editArchiveDir: string;

    constructor(
        private readonly nbName: string,
        private readonly nbDir: string
    ) {
        this.editDir = path.join(this.nbDir, 'editor');
        existsSync(this.editDir) || mkdirpSync(this.editDir);

        this.editorFile = path.join(this.editDir, `${section}@editor.yml`);
        existsSync(this.editorFile) || vfs.writeFileSync(this.editorFile, '');

        this.editArchiveDir = path.join(this.editDir, 'editor_archives');
        existsSync(this.editArchiveDir) || mkdirpSync(this.editArchiveDir);
    }

    public getEditorFile = () => this.editorFile;

    public getEditorObj = () => tools.readYamlSync(this.editorFile) as IEditBase;

    public createNoteEditorFile(nId: string, contents: string[], gl: GroupLables) {
        const ed: IEditNoteData = {
            kind: 'EditNote',
            immutable: {
                nbName: this.nbName,
                nId: nId,
                groupLabels: gl,
                contents: contents
            },
            editable: {
                delete: false,
                groupLabels: gl,
                contents: contents,
            }
        };
        tools.writeYamlSync(this.editorFile, ed);
    }

    public createDomainEditorFile(domainNode: string[], gl: GroupLables) {
        const ed: IEditDomain = {
            kind: 'EditDomain',
            immutable: {
                nbName: this.nbName,
                domainNode: domainNode.join(pathSplit),
                commonGroupLabels: gl
            },
            editable: {
                delete: {
                    notes: false,
                    domainNode: false
                },
                domainName: domainNode[domainNode.length - 1],
                commonGroupLabels: gl
            }
        };
        tools.writeYamlSync(this.editorFile, ed);
    }

    public createNotesSetGroupLabelsEditorFile(domainNode: string[], dgl: GroupLables, gl: GroupLables) {
        const ed = {
            kind: 'EditCommonGroupLabels',
            immutable: {
                nbName: this.nbName,
                domainNode: domainNode.join(pathSplit),
                domainGroupLabes: dgl,
                commonGroupLabels: gl
            },
            editable: {
                commonGroupLabels: gl
            }
        };
        tools.writeYamlSync(this.editorFile, ed);
    }

    public checkEditorCleaned() {
        return statSync(this.editorFile).size === 0;
    }

    public archiveEditor() {
        const ts = (new Date()).getTime();
        const e: IEditBase = tools.readYamlSync(this.editorFile);
        const k = e.kind.match(/[A-Z]/g)!.join('').toLocaleLowerCase();
        const archiveFile = path.join(this.editArchiveDir, `${ts}.${k}.yml`);
        moveSync(this.editorFile, archiveFile)
        // tools.writeYamlSync(archiveFile, e);
        // removeSync(this.editorFile)
        // tools.writeYamlSync(this.editFile, {});
    }
}