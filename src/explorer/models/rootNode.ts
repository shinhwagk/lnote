import * as vscode from 'vscode';

import { FilesFileNode } from './FilesFileNode';
import { DocFileNode } from './docFileNode';
import { NoteFileNode } from './noteFileNode';
import { NodeBase } from './nodeBase';
import { ErrorNode } from './errorNode';
import { readdirSync } from 'fs';
import * as os from 'os';
import * as path from 'path';

export class RootNode extends NodeBase {
    constructor(
        public readonly label: string,
        public readonly contextValue: 'noteRootNode' | 'docRootNode' | 'filesRootNode',
        public readonly globalStorage: vscode.Memento
    ) {
        super(label);
    }
    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            collapsibleState: this.contextValue === 'noteRootNode' ? 2 : 1,
            contextValue: this.contextValue
        };
    }

    public async getChildren(element: RootNode): Promise<NodeBase[]> {
        switch (element.contextValue) {
            case 'noteRootNode': {
                return this.getNoteFiles();
            }
            case 'filesRootNode': {
                return this.getFilesFiles();
            }
            case 'docRootNode': {
                return this.getDocFiles();
            }
            default: {
                throw new Error(`Unexpected contextValue ${element.contextValue}`);
            }
        }
    }
    async getNoteFiles(): Promise<(NoteFileNode | ErrorNode)[]> {
        const nFiles: NoteFileNode[] = [];
        const nid = this.globalStorage.get<number>('nid');
        if (!nid) {
            return nFiles;
        }

        const dbPath = vscode.workspace.getConfiguration('vscode-note').get<string>('dbPath', os.homedir());
        const notePath = path.join(dbPath, '.vscode-note', 'notes', nid.toString());

        const isColFile = n => /^[1-9]+[0-9]*\.[a-z]+$/.test(n);

        const fs = readdirSync(notePath).filter(isColFile);

        for (const f of fs) {
            const uri = vscode.Uri.file(path.join(notePath, f));
            nFiles.push(new NoteFileNode(f, uri));
        }
        const uri = vscode.Uri.file(path.join(notePath, '.n.json'));
        nFiles.push(new NoteFileNode('.n.json', uri));
        return nFiles;
    }
    async getFilesFiles() {
        const fFiles: FilesFileNode[] = [];
        return fFiles;
    }
    async getDocFiles() {
        const dFiles: DocFileNode[] = [];
        return dFiles;
    }
}
