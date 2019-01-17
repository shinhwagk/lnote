import * as path from 'path';
import * as os from 'os';

import * as vscode from 'vscode';

import { VSNDomainExplorer, VSNDomainNode } from './explorer/domainExplorer';
import { VSNWebviewExplorer as VSNNotePanelExplorer } from './panel/notesPanel';
import { VSNEditExplorer } from './explorer/editExplorer';
import { VSNDatabase } from './database';
import { splitPath } from './helper';
import { commands as cs } from './names.global';

export function activate(context: vscode.ExtensionContext) {
    console.log('vscode extension "vscode-note" is now active!');

    const vsndb = new VSNDatabase();
    console.log('vsndb startup.');

    const vsnDomain = VSNDomainExplorer(vsndb);
    console.log('vsn tree domain explorer startup.');

    const vsnPanel = VSNNotePanelExplorer(context, vsndb);
    console.log('vsn webview explorer startup.');

    const { treeDataProvider, treeView } = VSNEditExplorer();
    // console.log("vsn tree edit explorer startup.");

    // const vsnTreeFiles = VSNFilesExplorer();
    // const vsnTreeDocs = VSNDocsExplorer();

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vsnoteEditExplorer.openFileResource',
            async resource =>
                await vscode.window.showTextDocument(resource, { viewColumn: vscode.ViewColumn.Two })
        )
    );

    /**
     * create note ,enabel tree
     */
    context.subscriptions.push(
        vscode.commands.registerCommand(cs.createNote, async (node: VSNDomainNode) => {
            const noteid = vsndb.createNote(node.dpath);
            treeDataProvider.refreshRegistries();
            await vscode.commands.executeCommand('setContext', 'extension.note.edit', true);
            const uri = vscode.Uri.file(vsndb.selectNoteFsPath(noteid));
            treeDataProvider.refresh();
            // vscode.commands.executeCommand('updateOrCreateWebview', fspath);
        })
    );

    /**
     * close note edit tree
     * */
    context.subscriptions.push(
        vscode.commands.registerCommand(cs.editTreeClose, async () => {
            await vscode.commands.executeCommand('setContext', 'extension.note.edit', false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(cs.DomainCreate, async (node: VSNDomainNode) => {
            const name: string = await vscode.window.showInputBox();
            vscode.window.showInformationMessage(name);
            vsndb.createDomain(node.dpath, name);
            vsnDomain.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(cs.renameDomain, async (node: VSNDomainNode) => {
            const dpaths = splitPath(node.dpath);
            const oldname = dpaths[dpaths.length - 1];
            const newName: string = await vscode.window.showInputBox({ value: oldname });
            vsndb.renameDomain(node.dpath, newName);
            vscode.commands.executeCommand('updateOrCreateWebview', node.dpath);
            vsnDomain.refresh();
        })
    );
}

export function deactivate() {}
