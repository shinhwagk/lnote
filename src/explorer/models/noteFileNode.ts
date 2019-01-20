import * as vscode from 'vscode';

import { NodeBase } from './nodeBase';

import * as path from 'path';

export class NoteFileNode extends NodeBase {
    constructor(public readonly label: string, public readonly uri: vscode.Uri) {
        super(label);
    }

    public static readonly contextValue: string = 'localNodeFileNode';
    public readonly contextValue: string = NoteFileNode.contextValue;

    public getTreeItem(): vscode.TreeItem {
        const isColFile = /^[1-9]+[0-9]*\.[a-z]+$/.test(path.basename(this.uri.path));
        const isCol1File = '1.txt' !== path.basename(this.uri.path);

        const treeItem = new vscode.TreeItem(this.uri, vscode.TreeItemCollapsibleState.None);
        treeItem.contextValue = isColFile && isCol1File ? this.contextValue : 'localNodeFileMetaNode';
        treeItem.command = {
            command: 'vsnoteEditExplorer.openFileResource',
            arguments: [this.uri],
            title: 'fdfd'
        };
        return treeItem;
    }
}
