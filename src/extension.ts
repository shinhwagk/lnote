import * as vscode from 'vscode';

import * as tree from './treeview.main';
import { VSNWebviewView } from './webview.view';
import * as db from './database';

export function activate(context: vscode.ExtensionContext) {
    const vsnoteDB = new db.VSNDatabase();
    tree.activateVSNoteTreeViewExplorer(context);
    VSNWebviewView(context, vsnoteDB);
}

export function deactivate() {}
