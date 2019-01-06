import * as path from "path";

import * as vscode from "vscode";

import * as db from "./database";

export interface VSNoteNode {
    uri: vscode.Uri;
}

export function activateVSNoteTreeViewExplorer(context: vscode.ExtensionContext) {
    const treeDataProvider = new NoteTreeDataProvider(new db.VSNoteDatabase("s"));
    vscode.window.createTreeView('noteExplorer', { treeDataProvider });
}


export class NoteTreeDataProvider implements vscode.TreeDataProvider<VSNoteNode>{

    // onDidChangeTreeData?: vscode.Event<NoteNode>;
    db: db.VSNoteDatabase;
    constructor(db: db.VSNoteDatabase) { this.db = db; }
    async getTreeItem(element: VSNoteNode): Promise<vscode.TreeItem> {
        return {
            collapsibleState: this.db.existChildDomain(element.uri.path) ? 1 : 0, // vscode.TreeItemCollapsibleState
            command: {
                arguments: [element.uri],
                command: "updateOrCreateWebview",
                title: "Show Vscode Note",
            },
            label: path.basename(element.uri.toString())
        };
    }

    getChildren(element?: VSNoteNode): Thenable<VSNoteNode[]> {
        const vsnUri = element ? element.uri : vscode.Uri.parse("notes://vscode-note/");
        return Promise.resolve(this.db.readChildDomain(vsnUri.path)
            .map(uri => { return { uri: vscode.Uri.parse("notes://vscode-note/") }; }));
    }
}
