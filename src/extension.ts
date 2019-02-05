import * as path from 'path';
import * as vscode from 'vscode';
import {
    VSNNote,
    selectNotes,
    createNote,
    createNodeCol,
    createDomain,
    renameDomain,
    selectDocReadmeFilePath,
    deleteNote,
    selectFilesExist
} from './database';
import * as vsnPanel from './panel/notesPanel';
import { VSNDomainNode } from './explorer/domainExplorer';
import { vpath } from './helper';
import { fusionNotes } from './panel/notesPanel';
import { removeSync } from 'fs-extra';
import { initializeExtensionVariables, ext } from './extensionVariables';

export async function activate(context: vscode.ExtensionContext) {
    console.log('vscode extension "vscode-note" is now active!');

    await initializeExtensionVariables(context);

    vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('vscode-note')) {
            await initializeExtensionVariables(context);
            ext.vsnDomainProvider!.refresh();
        }
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('vsnPanel.update', async (dpath: string) => {
            context.globalState.update('dpath', dpath);
            const notes: VSNNote[] = await selectNotes(dpath);
            if (notes.length === 0) return;
            const vsnDomain = fusionNotes(path.basename(dpath), notes);
            vsnPanel.updateContent(vsnDomain);
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
            const filesFolder = path.join(ext.dbDirPath!, 'notes', nid.toString(), 'files');
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(filesFolder), true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.doc.showPreview', async (nId: number) => {
            ext.context!.globalState.update('nid', nId);
            const uri = vscode.Uri.file(selectDocReadmeFilePath(nId));
            await vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
            if (!selectFilesExist(nId)) return;
            ext.vsnFilesProvider!.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.files', true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.files.showPreview', async (nId: number) => {
            ext.context!.globalState.update('nid', nId);
            const uri = vscode.Uri.file(selectDocReadmeFilePath(nId));
            await vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
            if (!selectFilesExist(nId)) return;
            ext.vsnFilesProvider!.refresh();
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
            ext.vsnEditProvider!.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.edit', async (nid: number) => {
            context.globalState.update('nid', nid);
            ext.vsnEditProvider!.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', true);
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
                ext.vsnEditProvider!.refresh();
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.edit-explorer.note.col.add', async () => {
            const nid = context.globalState.get<number>('nid');
            if (nid) {
                createNodeCol(nid);
                ext.vsnEditProvider!.refresh();
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
            ext.vsnDomainProvider!.refresh();
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
                ext.vsnDomainProvider!.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.delete', async () => {
            const nId = ext.context!.globalState.get<number>('nid');
            const dpath = ext.context!.globalState.get<string>('dpath');
            if (!nId || !dpath) return;
            const sqp = await vscode.window.showQuickPick(['Yes', 'No']);
            if (!sqp) return;
            if (sqp === 'Yes') await deleteNote(dpath, nId);
            const notes: VSNNote[] = await selectNotes(dpath);
            const vsnDomain = fusionNotes(path.basename(dpath), notes);
            vsnPanel.updateContent(vsnDomain);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.files-explorer.openTerminal', async () => {
            const nId = ext.context!.globalState.get<number>('nid');
            const dpath = ext.context!.globalState.get<string>('dpath');
            if (!nId || !dpath) return;
            const filePath = path.join(ext.dbDirPath!, 'notes', nId.toString(), 'files');
            const fileTerminal = vscode.window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
            fileTerminal.show(true);
        })
    );
}

export function deactivate() {}
