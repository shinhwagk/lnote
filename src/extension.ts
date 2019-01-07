import * as vscode from 'vscode';

import * as tree from "./treeExplorer";
import * as db from "./database";

export function activate(context: vscode.ExtensionContext) {
    // tree.activateVSNoteTreeViewExplorer(context);
    vscode.window.showInformationMessage("2111");
    const treeDataProvider = new tree.NoteTreeDataProvider(new db.VSNoteDatabase());
    vscode.window.createTreeView('noteExplorer', { treeDataProvider });
}

export function deactivate() { }