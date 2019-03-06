import * as path from 'path';
import * as vscode from 'vscode';
import {
    createNodeCol,
    renameDomain,
    selectDocReadmeFile,
    deleteNote,
    Domain,
    DBCxt,
    createDomain,
    createNode,
    getNotePath,
    initializeDatabase,
    cacheTags
} from './database';
import * as notesPanel from './panel/notesPanel';
import { DomainNode } from './explorer/domainExplorer';
import { removeSync } from 'fs-extra';
import { initializeExtensionVariables, ext } from './extensionVariables';
import objectPath = require('object-path');
import untildify = require('untildify');
import { homedir } from 'os';
import { htmlShowPreview } from './panel/htmlPanel';

export async function activate(context: vscode.ExtensionContext) {
    console.log('vscode extension "vscode-note" is now active!');

    const dbpath: string | undefined = vscode.workspace.getConfiguration('vscode-note').get('dbpath');
    const dbDirPath = path.join(dbpath ? untildify(dbpath) : path.join(homedir(), '.vscode-note'));

    await initializeExtensionVariables(context);
    await initializeDatabase(dbDirPath);

    vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('vscode-note')) {
            await initializeDatabase(dbDirPath);
            ext.domainProvider.refresh();
        }
    });

    // vscode.workspace.onDidCloseTextDocument((e: vscode.TextDocument) => {
    //     vscode.window.showInformationMessage(e.uri.toString());
    // });

    context.subscriptions.push(
        vscode.commands.registerCommand('notesPanel.update', async () => {
            const dpath = context.globalState.get<string[]>('dpath');
            if (!dpath) return;
            const domain = objectPath.get(DBCxt.domainCache, dpath) as Domain;
            if (domain['.notes'].length === 0) return;
            await notesPanel.updateContent(domain['.notes']);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('editExplorer.openFileResource', async resource => {
            vscode.commands.executeCommand('vscode.open', resource, vscode.ViewColumn.Two);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.edit.full', async () => {
            const nid = context.globalState.get<number>('nid');
            if (!nid) return;
            await vscode.commands.executeCommand(
                'vscode.openFolder',
                vscode.Uri.file(getNotePath(nid)),
                true
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.doc.show', async (nId: number) => {
            ext.context.globalState.update('nid', nId);
            const readmeFile = selectDocReadmeFile(nId);
            if (path.basename(readmeFile).split('.')[1] === 'md') {
                const uri = vscode.Uri.file(readmeFile);
                await vscode.commands.executeCommand('markdown.showPreviewToSide', uri);
            } else {
                htmlShowPreview(readmeFile, dbDirPath);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.files.show', async (nId: number) => {
            ext.context.globalState.update('nid', nId);
            ext.FilesProvider.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.files', true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.add', async (node: DomainNode) => {
            const nid: number = await createNode(node.dpath);
            context.globalState.update('nid', nid);
            ext.editProvider.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.edit', async (nid: number) => {
            context.globalState.update('nid', nid);
            ext.editProvider.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.edit-explorer.close', async () => {
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', false);
            await vscode.commands.executeCommand('notesPanel.update');
            await vscode.commands.executeCommand('vscode-note.domain.refresh');
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
                ext.editProvider.refresh();
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.edit-explorer.note.col.add', async () => {
            const nid = context.globalState.get<number>('nid');
            if (nid) {
                createNodeCol(nid);
                ext.editProvider.refresh();
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.domain-explorer.pin', async (dpath: string[]) => {
            context.globalState.update('dpath', dpath);
            await vscode.commands.executeCommand('notesPanel.update');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.domain.add', async (node?: DomainNode) => {
            const dpath = node ? node.dpath : [];
            const name: string | undefined = await vscode.window.showInputBox();
            if (!name) return;
            createDomain(dpath, name);
            ext.domainProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.domain.rename', async (node: DomainNode) => {
            const dpaths = node.dpath;
            const oldname = dpaths[dpaths.length - 1];
            const newName: string | undefined = await vscode.window.showInputBox({ value: oldname });
            if (!newName) return;
            renameDomain(node.dpath, newName);
            ext.domainProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.delete', async () => {
            const nId = ext.context.globalState.get<number>('nid');
            const dpath = ext.context.globalState.get<string>('dpath');
            if (!nId || !dpath) return;
            const sqp = await vscode.window.showQuickPick(['Yes', 'No']);
            if (!sqp) return;
            if (sqp === 'Yes') await deleteNote(dpath, nId);
            await vscode.commands.executeCommand('notesPanel.update');
            // const notes: VSNNote[] = await selectNotes(dpath);
            // const vsnDomain = fusionNotes(path.basename(dpath), notes);
            // vsnPanel.updateContent(vsnDomain);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.files-explorer.openTerminal', async () => {
            const nId = ext.context.globalState.get<number>('nid');
            const dpath = ext.context.globalState.get<string>('dpath');
            if (!nId || !dpath) return;
            const filePath = path.join(DBCxt.dbDirPath!, 'notes', nId.toString(), 'files');
            const fileTerminal = vscode.window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
            fileTerminal.show(true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.domain.refresh', async () => {
            DBCxt.domainCache = await cacheTags();
            ext.domainProvider.refresh();
        })
    );
}

export function deactivate() { }
