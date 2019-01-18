import * as vscode from 'vscode';

import { NodeBase } from './nodeBase';

import * as os from 'os';
import * as path from 'path';

export class NoteFileNode extends NodeBase {
    constructor(public readonly label: string) {
        super(label);
    }

    public static readonly contextValue: string = 'file';
    public readonly contextValue: string = NoteFileNode.contextValue;

    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: this.contextValue,
            command: {
                command: 'vsnoteEditExplorer.openFileResourcee',
                title: 'aaa',
                arguments: [vscode.Uri.file(path.join(os.homedir(), '.vscode-note', 'notes', '1', '2.sql'))]
            }
        };
    }
}
