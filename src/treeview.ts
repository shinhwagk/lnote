import * as path from "path";

import * as vscode from "vscode";

import * as db from "./database";

export interface VSNDomainNode {
    dpath: string;
}

export function activateVSNoteTreeViewExplorer(context: vscode.ExtensionContext) {
    const treeDataProvider = new NoteTreeDataProvider(new db.VSNDatabase());
    vscode.window.createTreeView('vsnoteExplorer', { treeDataProvider });
}

export class NoteTreeDataProvider implements vscode.TreeDataProvider<VSNDomainNode>{

    // onDidChangeTreeData?: vscode.Event<NoteNode>;
    db: db.VSNDatabase;
    constructor(db: db.VSNDatabase) { this.db = db; }
    async getTreeItem(element: VSNDomainNode): Promise<vscode.TreeItem> {
        return {
            collapsibleState: (this.db.selectDomain(element.dpath).childs.length >= 1 ? true : false) ? 1 : 0, // vscode.TreeItemCollapsibleState
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
        return Promise.resolve(this.db.selectDomain(dpath).childs
            .map(childDomainName => { return { dpath: path.join(dpath, childDomainName) }; }));
    }
}
