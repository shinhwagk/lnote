import * as vscode from 'vscode';

import { NoteFileNode } from './noteFileNode';
import { NodeBase } from './nodeBase';
import { ErrorNode } from './errorNode';
import { readdirSync, statSync } from 'fs';
import { ext } from '../../extensionVariables';
import * as path from 'path';
import { FileSystemFileNode as FileSystemNode } from './filesSystemNode';

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
                return await this.getDocFiles();
            }
            default: {
                throw new Error(`Unexpected contextValue ${element.contextValue}`);
            }
        }
    }
    async getNoteFiles(): Promise<(NoteFileNode | ErrorNode)[]> {
        const nNodes: NoteFileNode[] = [];
        const nid = this.globalStorage.get<number>('nid');
        if (!nid) {
            return nNodes;
        }

        const notePath = path.join(ext.dbDirPath, 'notes', nid.toString());

        const isColFile = (n: string) => /^[1-9]+[0-9]*\.[a-z]+$/.test(n);

        const fs = readdirSync(notePath).filter(isColFile);

        for (const f of fs) {
            const uri = vscode.Uri.file(path.join(notePath, f));
            nNodes.push(new NoteFileNode(f, uri));
        }
        const uri = vscode.Uri.file(path.join(notePath, '.n.yml'));
        nNodes.push(new NoteFileNode('.n.yml', uri));
        return nNodes;
    }
    async getFilesFiles() {
        const fnodes: FileSystemNode[] = [];
        const nid = this.globalStorage.get<number>('nid');
        if (!nid) return fnodes;

        const docPath = path.join(ext.dbDirPath, 'notes', nid.toString(), 'files');

        for (const f of readdirSync(docPath)) {
            const p = path.join(docPath, f);
            const stat = statSync(p);
            const fileType = stat.isDirectory ? vscode.FileType.Directory : vscode.FileType.File;
            const fsn = new FileSystemNode(f, vscode.Uri.file(p), fileType);
            fnodes.push(fsn);
        }

        return fnodes;
    }
    async getDocFiles() {
        const fnodes: FileSystemNode[] = [];
        const nid = this.globalStorage.get<number>('nid');
        if (!nid) return fnodes;

        const docFsPath = path.join(ext.dbDirPath, 'notes', nid.toString(), 'doc');

        for (const cf of readdirSync(docFsPath)) {
            const p = path.join(docFsPath, cf);
            const stat = statSync(p);
            const fileType = stat.isDirectory() ? vscode.FileType.Directory : vscode.FileType.File;
            const fsn = new FileSystemNode(cf, vscode.Uri.file(p), fileType);
            fnodes.push(fsn);
        }
        return fnodes;
    }
}
