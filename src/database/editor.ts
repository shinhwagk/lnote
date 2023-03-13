import { statSync } from 'fs';
import * as path from 'path';
import { existsSync, mkdirpSync } from 'fs-extra';
import { pathSplit, section } from '../constants';
import { tools, vfs } from '../helper';
import { GroupLables } from '../types';
import { IEdit, IEditNoteData, IEditDomain } from './notebook';


export class VNNotebookEditor {
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

    public getEditorObj = () => tools.readYamlSync(this.editorFile) as IEdit;

    public createNoteData(nId: string, contents: string[], gl: GroupLables) {
        const ed: IEditNoteData = {
            kind: 'EditNote',
            immutable: {
                nbName: this.nbName,
                nId: nId,
                groupLabels: gl,
                contents: contents
            },
            editable: {
                groupLabels: gl,
                contents: contents,
            }
        };
        tools.writeYamlSync(this.editorFile, ed);
    }

    public createDomainEditor(domainNode: string[], gl: GroupLables) {
        const ed: IEditDomain = {
            kind: 'EditDomain',
            immutable: {
                nbName: this.nbName,
                domainNode: domainNode.join(pathSplit),
                commonGroupLabels: gl
            },
            editable: {
                domainNode: domainNode.join(pathSplit),
                commonGroupLabels: gl
            }
        };
        tools.writeYamlSync(this.editorFile, ed);
    }

    public createNotesSetGroupLabels(domainNode: string[], dgl: GroupLables, gl: GroupLables) {
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
        const e: IEdit = tools.readYamlSync(this.editorFile);
        const k = e.kind.match(/[A-Z]/g)!.join('').toLocaleLowerCase();
        const archiveFile = path.join(this.editArchiveDir, `${ts}.${k}.yml`);
        tools.writeYamlSync(archiveFile, e);
        // removeSync(this.editorFile)
        // tools.writeYamlSync(this.editFile, {});
    }
}
