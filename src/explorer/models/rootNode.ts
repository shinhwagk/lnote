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
        public readonly contextValue: 'noteRootNode' | 'docRootNode' | 'filesRootNode' | 'none'
    ) {
        super(label);
    }
    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
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
        const fs = readdirSync(path.join(os.homedir(), '.vscode-note', 'notes', '1'));
        for (const f of fs) {
            nFiles.push(new NoteFileNode(f));
        }
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
