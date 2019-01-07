import * as vscode from 'vscode';

import * as tree from "./treeExplorer";
import { activate as webview } from './webview';
import * as db from "./database";

export function activate(context: vscode.ExtensionContext) {
    const vsnoteDB = new db.VSNoteDatabase();
    tree.activateVSNoteTreeViewExplorer(context);
    webview(context, vsnoteDB);
}

export function deactivate() { }