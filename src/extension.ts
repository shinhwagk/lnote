import * as path from 'path';
import * as vscode from 'vscode';
import {
    VSNNote,
    initDB,
    selectNotes,
    createNote,
    createNodeCol,
    createDomain,
    renameDomain
} from './database';
import { VSNDomainExplorerProvider, VSNDomainNode } from './explorer/domainExplorer';
import { VSNEditExplorerProvider } from './explorer/editExplorer';
import { splitPath } from './helper';
import { commands as cs } from './names.global';
import { VSNWebviewPanel as VSNPanel, fusionNotes } from './panel/notesPanel';
import { NoteFileNode } from './explorer/models/noteFileNode';
import { removeSync } from 'fs-extra';

export async function activate(context: vscode.ExtensionContext) {
    const dbDirPath: string | undefined = vscode.workspace.getConfiguration('vscode-note').get('dbpath');

    // vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {});
    initDB(dbDirPath);

    const globalState: vscode.Memento = context.globalState;
    console.log('vscode extension "vscode-note" is now active!');

    // const vsndb = new VSNDatabase();
    // console.log('vsndb startup.');
    const vsnDomainTree = new VSNDomainExplorerProvider();
    vscode.window.createTreeView('vsnoteDomainExplorer', { treeDataProvider: vsnDomainTree });

    // const vsnPanel = VSNNotePanelExplorer(context, vsndb);
    const vsnPanel = new VSNPanel(context);
    console.log('vsn webview explorer startup.');

    const vsnEditTree = new VSNEditExplorerProvider(globalState);
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
        vscode.commands.registerCommand(cs.DomainCreate, async (node: VSNDomainNode) => {
            const name: string = await vscode.window.showInputBox();
            vscode.window.showInformationMessage(name);
            createDomain(node.dpath, name);
            vsnDomainTree.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(cs.renameDomain, async (node: VSNDomainNode) => {
            const dpaths = splitPath(node.dpath);
            const oldname = dpaths[dpaths.length - 1];
            const newName: string = await vscode.window.showInputBox({ value: oldname });
            renameDomain(node.dpath, newName);
            vscode.commands.executeCommand('vsnPanel.update', node.dpath);
            vsnDomainTree.refresh();
        })
    );
}

export function deactivate() {}
