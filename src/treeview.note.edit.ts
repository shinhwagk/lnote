import * as path from 'path';

import * as vscode from 'vscode';

import { readdirSync } from 'fs-extra';

interface NoteNode {
    uri: vscode.Uri;
}

export function VSNNoteEditExplorer(fsPath: string) {
    const treeDataProvider = new VSNNoteEditTreeExplorer(fsPath);
    return vscode.window.createTreeView('vsnoteNoteEditExplorer', {
        treeDataProvider,
        showCollapseAll: true
    });
}

function readDirectory(uri: vscode.Uri): Thenable<[string, NoteNode][]> {
    const files = readdirSync(uri.fsPath);
    const result: [string, NoteNode][] = [];
    files.forEach(name => {
        const u: vscode.Uri = vscode.Uri.parse(path.join(uri.fsPath, name));
        const f: NoteNode = { uri: u };
        result.push([name, f]);
    });
    return Promise.resolve(result);
}

class VSNNoteEditTreeExplorer implements vscode.TreeDataProvider<NoteNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<NoteNode> = new vscode.EventEmitter<NoteNode>();
    readonly onDidChangeTreeData: vscode.Event<NoteNode> = this._onDidChangeTreeData.event;

    private readonly uri: vscode.Uri;

    constructor(fsPath: string) {
        this.uri = vscode.Uri.parse(fsPath);
    }

    public refresh(noteid: string): any {
        const fn = { uri: vscode.Uri.parse('fdfdfd') };
        this._onDidChangeTreeData.fire(fn);
    }

    getTreeItem(element: NoteNode): Thenable<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(element.uri, vscode.TreeItemCollapsibleState.None);

        // treeItem.command = {
        //     command: 'fileExplorer.openFile',
        //     title: 'Open File',
        //     arguments: [element.uri]
        // };
        // treeItem.contextValue = 'file';
        treeItem.label = path.basename(element.uri.path);

        return Promise.resolve(treeItem);
    }

    getChildren(element?: NoteNode): Thenable<NoteNode[]> {
        if (!element) {
            const x = readDirectory(this.uri).then(f => f.map(b => b[1]));
            return Promise.resolve(x);
        }
        return Promise.resolve([]);
    }
}
