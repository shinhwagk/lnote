import * as path from "path";

import * as vscode from "vscode";

import * as db from "./database";

export interface VSNDomainNode {
    dpath: string;
}

export function activateVSNoteTreeViewExplorer(context: vscode.ExtensionContext) {
    const treeDataProvider = new NoteTreeDataProvider(new db.VSNoteDatabase());
    vscode.window.createTreeView('vsnoteExplorer', { treeDataProvider });
}

export class NoteTreeDataProvider implements vscode.TreeDataProvider<VSNDomainNode>{

    // onDidChangeTreeData?: vscode.Event<NoteNode>;
    db: db.VSNoteDatabase;
    constructor(db: db.VSNoteDatabase) { this.db = db; }
    async getTreeItem(element: VSNDomainNode): Promise<vscode.TreeItem> {
        return {
            collapsibleState: this.db.existChildDomain(element.dpath) ? 1 : 0, // vscode.TreeItemCollapsibleState
            command: {
                arguments: [element.dpath],
                command: "updateOrCreateWebview",
                title: "Show Vscode Note",
            },
            label: path.basename(element.dpath)
        };
    }

    getChildren(element?: VSNDomainNode): Thenable<VSNDomainNode[]> {
        const dpath: string = element ? element.dpath : "/";
        return Promise.resolve(this.db.readChildDomain(dpath)
            .map(domain => { return { dpath: path.join(dpath, domain.name) }; }));
    }
}
