import * as path from 'path';
import * as vscode from 'vscode';
import {
    VSNNote,
    initDB,
    selectNotes,
    createNote,
    createNodeCol,
    createDomain,
    renameDomain,
    selectDocReameFilePath
} from './database';
import { VSNDomainExplorerProvider, VSNDomainNode } from './explorer/domainExplorer';
import { VSNEditExplorerProvider } from './explorer/editExplorer';
import { splitPath } from './helper';
import { commands as cs } from './names.global';
import { VSNWebviewPanel as VSNPanel, fusionNotes } from './panel/notesPanel';
import { NoteFileNode } from './explorer/models/noteFileNode';
import { removeSync } from 'fs-extra';

export async function activate(context: vscode.ExtensionContext) {
    console.log('vscode extension "vscode-note" is now active!');

    const dbDirPath: string | undefined = vscode.workspace.getConfiguration('vscode-note').get('dbpath');

    // vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {});
    await initDB(dbDirPath);
    console.log('init db.');

    const globalState: vscode.Memento = context.globalState;

    const vsnDomainTree = new VSNDomainExplorerProvider();
    vscode.window.createTreeView('vsnoteDomainExplorer', { treeDataProvider: vsnDomainTree });
    console.log('vsn tree domain explorer startup.');

    const vsnPanel = new VSNPanel(context);
    console.log('vsn webview explorer startup.');

    const vsnEditTree = new VSNEditExplorerProvider(globalState);
    vscode.window.createTreeView('vsnoteEditExplorer', { treeDataProvider: vsnEditTree });
    console.log('vsn tree edit explorer startup.');

    // const vsnTreeFiles = VSNFilesExplorer();
    // const vsnTreeDocs = VSNDocsExplorer();

    context.subscriptions.push(
        vscode.commands.registerCommand('vsnPanel.update', async (dpath: string) => {
            vsnPanel.initIfNeed();
            const notes: VSNNote[] = await selectNotes(dpath);
            const vsnDomain = fusionNotes(path.basename(dpath), notes);
            vsnPanel.updateWebviewContent(vsnDomain);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vsnoteEditExplorer.openFileResource', async resource =>
            vscode.window.showTextDocument(resource, { viewColumn: vscode.ViewColumn.Two })
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.doc.showPreview', async (nId: number) => {
            const rp = selectDocReameFilePath(nId);
            const uri = vscode.Uri.file(rp);
            vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
        })
    );

    /**
     * create note ,enabel tree
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.create', async (node: VSNDomainNode) => {
            const nid: number = await createNote(node.dpath);
            globalState.update('nid', nid);
            vsnEditTree.refresh();
            await vscode.commands.executeCommand('setContext', 'extension.note.edit', true);
            // const uri = vscode.Uri.file(vsndb.selectNoteFsPath(noteid));
            // treeDataProvider.refresh();
            // vscode.commands.executeCommand('vsnPanel.update', fspath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.edit', async (nid: number) => {
            globalState.update('nid', nid);
            vsnEditTree.refresh();
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
                vsnEditTree.refresh();

                // vsndb.deleteNodeCol(t.resourceUri.fsPath);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.edit-explorer.note.col.add', async () => {
            const nid = globalState.get<number>('nid');
            if (nid) {
                createNodeCol(nid);
                vsnEditTree.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.domain.create', async (node: VSNDomainNode) => {
            const name: string | undefined = await vscode.window.showInputBox();
            if (name) {
                createDomain(node.dpath, name);
                vsnDomainTree.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(cs.renameDomain, async (node: VSNDomainNode) => {
            const dpaths = splitPath(node.dpath);
            const oldname = dpaths[dpaths.length - 1];
            const newName: string | undefined = await vscode.window.showInputBox({ value: oldname });
            if (newName) {
                renameDomain(node.dpath, newName);
                vscode.commands.executeCommand('vsnPanel.update', node.dpath);
                vsnDomainTree.refresh();
            }
        })
    );
}

export function deactivate() {}
