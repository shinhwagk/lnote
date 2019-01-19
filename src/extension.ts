import * as path from 'path';
import * as vscode from 'vscode';
import * as os from 'os';
import { VSNDatabase, VSNNote } from './database';
import { VSNDomainExplorer, VSNDomainNode } from './explorer/domainExplorer';
import { VSNNoteEditExplorerProvider as VSNEditExplorerProvider } from './explorer/editExplorer';
import { splitPath, vfs } from './helper';
import { commands as cs } from './names.global';
import { VSNWebviewPanel as VSNPanel, fusionNotes } from './panel/notesPanel';
import { readdirSync, writeFileSync } from 'fs';
import { NoteFileNode } from './explorer/models/noteFileNode';
import { removeSync } from 'fs-extra';

export function activate(context: vscode.ExtensionContext) {
    const globalStorage: vscode.Memento = context.globalState;
    console.log('vscode extension "vscode-note" is now active!');

    const vsndb = new VSNDatabase();
    console.log('vsndb startup.');

    const vsnDomain = VSNDomainExplorer(vsndb);
    console.log('vsn tree domain explorer startup.');

    // const vsnPanel = VSNNotePanelExplorer(context, vsndb);
    const vsnPanel = new VSNPanel(context);
    console.log('vsn webview explorer startup.');

    const vsnEditTreeDataProvider = new VSNEditExplorerProvider(globalStorage);
    const treeView = vscode.window.createTreeView('vsnoteEditExplorer', {
        treeDataProvider: vsnEditTreeDataProvider,
        showCollapseAll: true
    });
    console.log('vsn tree edit explorer startup.');

    // const vsnTreeFiles = VSNFilesExplorer();
    // const vsnTreeDocs = VSNDocsExplorer();

    context.subscriptions.push(
        vscode.commands.registerCommand('vsnPanel.update', (dpath: string) => {
            vsnPanel.initIfNeed();
            const notes: VSNNote[] = vsndb.selectNotes(dpath);
            const vsnDomain = fusionNotes(path.basename(dpath), notes);
            vsnPanel.updateWebviewContent(vsnDomain);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vsnoteEditExplorer.openFileResource', async resource =>
            vscode.window.showTextDocument(resource, { viewColumn: vscode.ViewColumn.Two })
        )
    );

    /**
     * create note ,enabel tree
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.create', async (node: VSNDomainNode) => {
            const nid = vsndb.createNote(node.dpath);
            globalStorage.update('nid', nid);
            vsnEditTreeDataProvider.refresh();
            await vscode.commands.executeCommand('setContext', 'extension.note.edit', true);
            // const uri = vscode.Uri.file(vsndb.selectNoteFsPath(noteid));
            // treeDataProvider.refresh();
            // vscode.commands.executeCommand('vsnPanel.update', fspath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.edit', async (nid: number) => {
            globalStorage.update('nid', nid);
            vsnEditTreeDataProvider.refresh();
            await vscode.commands.executeCommand('setContext', 'extension.note.edit', true);
            // const uri = vscode.Uri.file(vsndb.selectNoteFsPath(noteid));
            // treeDataProvider.refresh();
            // vscode.commands.executeCommand('vsnPanel.update', fspath);
        })
    );

    /**
     * close note edit tree
     * */
    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.edit-explorer.close', async () => {
            await vscode.commands.executeCommand('setContext', 'extension.note.edit', false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-note.edit-explorer.note.col.remove',
            async (f: NoteFileNode) => {
                removeSync(f.uri.fsPath);
                vsnEditTreeDataProvider.refresh();

                // vsndb.deleteNodeCol(t.resourceUri.fsPath);
            }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.edit-explorer.note.col.add', async () => {
            const nid = globalStorage.get<number>('nid');
            if (nid) {
                vsndb.createNodeCol(nid);
                vsnEditTreeDataProvider.refresh();
            }
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
            vscode.commands.executeCommand('vsnPanel.update', node.dpath);
            vsnDomain.refresh();
        })
    );
}

export function deactivate() {}
