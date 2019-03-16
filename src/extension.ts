import * as path from 'path';
import * as vscode from 'vscode';
import {
    createNodeCol,
    resetNoteTags,
    selectDocReadmeFile,
    deleteNote,
    DBCxt,
    createDomain,
    createNode,
    getNotePath,
    initializeDatabase,
    refreshDomainCache,
    selectDomainNotes
} from './database';
import * as notesPanel from './panel/notesPanel';
import { DomainNode } from './explorer/domainExplorer';
import { removeSync } from 'fs-extra';
import { initializeExtensionVariables, ext } from './extensionVariables';
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

    context.subscriptions.push(
        vscode.commands.registerCommand('notesPanel.update', async (vdata?: any) => {
            if (vdata) {
                await notesPanel.updateContent(vdata);
                return;
            }
            const dpath: string[] = ext.context.globalState.get<string[]>('dpath')!;
            const notes = await selectDomainNotes(dpath);
            await notesPanel.updateContent(await notesPanel.genViewDataByNotes(notes));
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('editExplorer.openFileResource', async resource => {
            vscode.commands.executeCommand('vscode.open', resource, vscode.ViewColumn.Two);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.edit.full', async () => {
            const nid = context.globalState.get<string>('nid')!;
            await vscode.commands.executeCommand(
                'vscode.openFolder',
                vscode.Uri.file(getNotePath(nid)),
                true
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.doc.show', async (nId: string) => {
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
        vscode.commands.registerCommand('vscode-note.note.files.show', async (nId: string) => {
            ext.context.globalState.update('nid', nId);
            ext.FilesProvider.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.files', true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.add', async (category: string) => {
            const dpath = context.globalState.get<string[]>('dpath')!;
            const nid: string = await createNode(dpath, category);
            await vscode.commands.executeCommand('vscode-note.note.edit', nid);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.category.add', async () => {
            const dpath: string[] = ext.context.globalState.get<string[]>('dpath')!;
            const notes = await selectDomainNotes(dpath)
            const vdata = await notesPanel.genViewDataByNotes(notes)
            const cname: string | undefined = await vscode.window.showInputBox({ value: 'default' });
            if (!cname) return;
            if (vdata.categorys.filter(c => c.name === cname).length >= 1) return;
            const cs = vdata.categorys.concat({ name: cname, notes: [] });
            await vscode.commands.executeCommand('notesPanel.update', { name: vdata.name, categorys: cs });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.edit', async (nid: string) => {
            context.globalState.update('nid', nid);
            ext.editProvider.refresh();
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', true);
            await vscode.commands.executeCommand('editExplorer.openFileResource', vscode.Uri.file(path.join(DBCxt.dbDirPath, nid, '1.txt')));
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
            const nid = context.globalState.get<string>('nid')!;
            const id = await createNodeCol(nid);
            await vscode.commands.executeCommand('editExplorer.openFileResource', vscode.Uri.file(path.join(DBCxt.dbDirPath, nid, `${id}.txt`)));
            ext.editProvider.refresh();
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
            const dpath = node.dpath;
            const oldname = dpath[dpath.length - 1];
            const newName: string | undefined = await vscode.window.showInputBox({ value: oldname });
            if (!newName) return;
            await resetNoteTags(dpath, newName);
            DBCxt.domainCache = await refreshDomainCache();
            ext.domainProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.note.delete', async () => {
            const nId = ext.context.globalState.get<string>('nid')!;
            const sqp = await vscode.window.showQuickPick(['Yes', 'No']);
            if (!sqp) return;
            if (sqp === 'Yes') await deleteNote(nId);
            await vscode.commands.executeCommand('vscode-note.domain.refresh');
            await vscode.commands.executeCommand('notesPanel.update');
            await vscode.commands.executeCommand('setContext', 'vscode-note.note.edit', false);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.files-explorer.openTerminal', async () => {
            const nId = ext.context.globalState.get<string>('nid');
            const dpath = ext.context.globalState.get<string>('dpath');
            if (!nId || !dpath) return;
            const filePath = path.join(DBCxt.dbDirPath!, 'notes', nId, 'files');
            const fileTerminal = vscode.window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
            fileTerminal.show(true);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vscode-note.domain.refresh', async () => {
            DBCxt.domainCache = await refreshDomainCache();
            ext.domainProvider.refresh();
        })
    );
}

export function deactivate() { }
