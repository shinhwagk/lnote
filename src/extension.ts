import * as vscode from 'vscode';

import * as tree from "./treeExplorer";

export function activate(context: vscode.ExtensionContext) {
    tree.activateVSNoteTreeViewExplorer(context);
}

export function deactivate() {
}