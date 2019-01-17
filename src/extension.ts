import * as vscode from 'vscode';

import { VSNDomainExplorer, VSNDomainNode } from './treeview.domain';
import { VSNWebviewExplorer } from './webview.view';
// import { VSNFilesExplorer as VSNNoteEditExplorer } from './treeview.files';
import { VSNNoteEditExplorer } from './treeview.note.edit';
import { VSNDatabase } from './database';
import { splitPath } from './helper';
import { commands as cs } from './names.global';

import * as path from "path";
import * as os from "os";

export function activate(context: vscode.ExtensionContext) {
    console.log('vscode extension "vscode-note" is now active!');

    const vsndb = new VSNDatabase();

    const vsnTreeDomain = VSNDomainExplorer(vsndb);
    const vsnPanel = VSNWebviewExplorer(context, vsndb);
    // const vsnTreeFiles = VSNFilesExplorer();
    // const vsnTreeDocs = VSNDocsExplorer();
    
    // vscode.commands.executeCommand('setContext', 'extension.files', true);
    // vscode.commands.executeCommand('setContext', 'extension.docs', true);

    context.subscriptions.push(
        vscode.commands.registerCommand(cs.createNote, async (node: VSNDomainNode) => {
            const noteid = vsndb.createNote(node.dpath);
            await vscode.commands.executeCommand('setContext', 'extension.note.edit', true);

            const fspath = path.join(os.homedir(),".vscode-note","notes",noteid.toString())
            const vsnTreeNoteEdit = VSNNoteEditExplorer(fspath);

            
            // vscode.commands.executeCommand('updateOrCreateWebview', fspath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(cs.createDomain, async (node: VSNDomainNode) => {
            const name: string = await vscode.window.showInputBox();
            vscode.window.showInformationMessage(name);
            vsndb.createDomain(node.dpath, name);
            vsnTreeDomain.refresh();
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(cs.renameDomain, async (node: VSNDomainNode) => {
            const dpaths = splitPath(node.dpath);
            const oldname = dpaths[dpaths.length - 1];
            const newName: string = await vscode.window.showInputBox({ value: oldname });
            vsndb.renameDomain(node.dpath, newName);
            vscode.commands.executeCommand('updateOrCreateWebview', node.dpath);
            vsnTreeDomain.refresh();
        })
    );

    context.subscriptions.push();
}

export function deactivate() {}
