import * as vscode from 'vscode';

import * as tree from "./treeview";
import { VSNWebviewView } from './webview.view';
import * as db from "./database";
import { VSNWebviewForm } from './webview.form';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "helloworld-sample" is now active!');
    const vsnoteDB = new db.VSNDatabase();
    tree.activateVSNoteTreeViewExplorer(context);
    VSNWebviewView(context, vsnoteDB);
    const vvv = VSNWebviewForm.activate(context);

    context.subscriptions.push(vvv.commandhandler());
}

export function deactivate() { }