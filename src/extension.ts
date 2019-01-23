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
    selectDocReadmeFilePath
} from './database';
import { VSNDomainExplorerProvider, VSNDomainNode } from './explorer/domainExplorer';
import { VSNSampleEditExplorerProvider } from './explorer/sampleEditExplorer';
import { vpath } from './helper';
import { VSNWebviewPanel as VSNPanel, fusionNotes } from './panel/notesPanel';
import { removeSync } from 'fs-extra';
import { initializeExtensionVariables, ext } from './extensionVariables';
import { VSNFilesExplorerProvider } from './explorer/filesExplorer';

export async function activate(context: vscode.ExtensionContext) {
    console.log('vscode extension "vscode-note" is now active!');

    initializeExtensionVariables(context);
    await initDB();
    console.log('init db.');

    vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('vscode-note')) {
            initializeExtensionVariables(context);
            await initDB();
            console.log('init db.');
        }
    });

    const vsnDomainTree = new VSNDomainExplorerProvider();
    vscode.window.createTreeView('vsnoteDomainExplorer', { treeDataProvider: vsnDomainTree });
    console.log('vsn tree domain explorer startup.');

    const vsnPanel = new VSNPanel(context);
    console.log('vsn webview explorer startup.');

    const vsnEditTree = new VSNSampleEditExplorerProvider();
    vscode.window.createTreeView('vsnoteEditExplorer', { treeDataProvider: vsnEditTree });
    console.log('vsn tree edit explorer startup.');

    const vsnFilesTree = new VSNFilesExplorerProvider();
    vscode.window.createTreeView('vsnoteFilesExplorer', { treeDataProvider: vsnFilesTree });
    console.log('vsn tree files explorer startup.');
    // const vsnTreeFiles = VSNFilesExplorer();
    // const vsnTreeDocs = VSNDocsExplorer();

    context.subscriptions.push(
        vscode.commands.registerCommand('vsnPanel.update', async (dpath: string) => {
            vsnPanel.initIfNeed();
            const notes: VSNNote[] = await selectNotes(dpath);
            if (notes.length === 0) return;
            const vsnDomain = fusionNotes(path.basename(dpath), notes);
            vsnPanel.updateWebviewContent(vsnDomain);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vsnoteEditExplorer.openFileResource', async resource => {
            vscode.commands.executeCommand('vscode.open', resource, vscode.ViewColumn.Two);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.files.edit', async () => {
            const nid = context.globalState.get<number>('nid');
            if (!nid) return;
            const filesFolder = path.join(ext.dbDirPath, 'notes', nid.toString(), 'files');
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(filesFolder), true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.doc.showPreview', async (nId: number) => {
            ext.context.globalState.update('nid', nId);
            const rp = selectDocReadmeFilePath(nId);
            const uri = vscode.Uri.file(rp);
            vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
            vsnFilesTree.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.files', true);
        })
    );

    /**
     * create note ,enabel tree
     */
    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.create', async (node: VSNDomainNode) => {
            const nid: number = await createNote(node.dpath);
            context.globalState.update('nid', nid);
            vsnEditTree.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', true);
            // const uri = vscode.Uri.file(vsndb.selectNoteFsPath(noteid));
            // treeDataProvider.refresh();
            // vscode.commands.executeCommand('vsnPanel.update', fspath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.edit', async (nid: number) => {
            context.globalState.update('nid', nid);
            vsnEditTree.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', true);
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
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', false);
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.files-explorer.close', async () => {
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.files', false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'vscode-note.edit-explorer.note.col.remove',
            async (f: vscode.TreeItem) => {
                removeSync(f.resourceUri!.fsPath);
                vsnEditTree.refresh();
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.edit-explorer.note.col.add', async () => {
            const nid = context.globalState.get<number>('nid');
            if (nid) {
                createNodeCol(nid);
                vsnEditTree.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.domain-explorer.pin', async (dpath: string) => {
            await vscode.commands.executeCommand('vsnPanel.update', dpath);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.domain.create', async (node?: VSNDomainNode) => {
            const name: string | undefined = await vscode.window.showInputBox();
            if (!name) return;
            const dpath = node ? node.dpath : '/';
            createDomain(dpath, name);
            vsnDomainTree.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.domain.rename', async (node: VSNDomainNode) => {
            const dpaths = vpath.splitPath(node.dpath);
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
