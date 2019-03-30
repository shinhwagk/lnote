import { removeSync } from 'fs-extra';
import * as path from 'path';
import { DomainNode } from './explorer/domainExplorer';
import { ext, initializeExtensionVariables, getDbDirPath } from './extensionVariables';
import { noteDocHtmlPanel } from './panel/noteDocHtmlPanel';
import { vscodeConfigSection } from './constants';
import { ExtensionContext, ConfigurationChangeEvent, ViewColumn, commands, workspace, Uri, window, TreeItem } from 'vscode';
import { DatabaseFileSystem } from './database';
import { vpath } from './helper';

export async function activate(context: ExtensionContext) {
    console.log('vscode extension "vscode-note" is now active!');

    initializeExtensionVariables(context);

    context.subscriptions.push(
        workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
            if (e.affectsConfiguration(vscodeConfigSection)) {
                await commands.executeCommand('vscode-note.domain.refresh');
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand('editExplorer.openFileResource', async (resource: any) => {
            commands.executeCommand('vscode.open', resource, ViewColumn.Two);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.edit.full', async () => {
            await commands.executeCommand('openFolder',
                Uri.file(ext.dbFS.getNotePath(ext.activeNoteId!)), true);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.doc.show', async (nId: string) => {
            const readmeFile = ext.dbFS.selectDocIndexFile(nId);
            if (path.basename(readmeFile).split('.')[1] === 'md') {
                const uri = Uri.file(readmeFile);
                await commands.executeCommand('markdown.showPreviewToSide', uri);
            } else {
                noteDocHtmlPanel(readmeFile);
            }
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.files.show', async (nId: string) => {
            ext.activeNoteId = nId;
            ext.filesProvider.refresh();
            await commands.executeCommand('setContext', 'vscode-note.note.files', true);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.add', async (category: string) => {
            const nid: string = ext.dbFS.createNode(ext.activeDpath, category);
            await commands.executeCommand('vscode-note.note.edit', nid);
            await commands.executeCommand('editExplorer.openFileResource',
                Uri.file(ext.dbFS.getNoteContentFile(nid, '1'))
            );
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.category.add', async () => {
            const cname: string | undefined = await window.showInputBox({ value: 'default' });
            if (!cname) return;
            ext.notesPanelView.parseDomain(ext.activeDpath).addCategory(cname).showNotesPlanView();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.edit', async (nId: string) => {
            ext.activeNoteId = nId;
            ext.editProvider.refresh();
            await commands.executeCommand('setContext', 'vscode-note.note.edit', true);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.create', async (domainNode: DomainNode) => {
            domainNode.dpath;
            ext.dbFS.dch.createNotes(domainNode.dpath);
            ext.domainProvider.refresh(domainNode);
            commands.executeCommand('vscode-note.domain.pin', domainNode.dpath);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.edit.close', async () => {
            await commands.executeCommand('setContext', 'vscode-note.note.edit', false);
            // ext.notesPanelView.parseDomain(ext.activeDpath).showNotesPlanView();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.files.close', async () => {
            await commands.executeCommand('setContext', 'vscode-note.note.files', false);
        })
    );

    context.subscriptions.push(
        commands.registerCommand(
            'vscode-note.note.edit.col.remove',
            async (f: TreeItem) => {
                removeSync(f.resourceUri!.fsPath);
                ext.editProvider.refresh();
            }
        )
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.edit.col.add', async () => {
            const nid = ext.activeNoteId!;
            const id = ext.dbFS.createNodeCol(nid);
            await commands.executeCommand(
                'editExplorer.openFileResource',
                Uri.file(ext.dbFS.getNoteContentFile(nid, id))
            );
            ext.editProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.pin', async (dpath: string[]) => {
            ext.activeDpath = dpath;
            ext.notesPanelView.parseDomain(dpath).showNotesPlanView();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.create', async (dn?: DomainNode) => {
            const dpath = dn ? dn.dpath : [];
            const name: string | undefined = await window.showInputBox();
            if (!name) return;
            ext.dbFS.dch.createDomain(dpath, name);
            ext.domainProvider.refresh(dn);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.rename', async (dn: DomainNode) => {
            const orgDpath = dn.dpath;
            const orgName = orgDpath[orgDpath.length - 1];
            const newName: string | undefined = await window.showInputBox({ value: orgName });
            if (!newName) return;
            const newDpath = orgDpath.slice();
            newDpath[newDpath.length - 1] = newName;
            ext.dbFS.renameDomain(orgDpath, newDpath);
            ext.domainProvider.refresh(dn, true);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.move', async (node: DomainNode) => {
            const orgDpath = node.dpath;
            const newName: string | undefined = await window.showInputBox({ value: orgDpath.join('/') });
            const cascade = await window.showQuickPick(['True', 'False']);
            if (!newName || !cascade) return;
            if (cascade === 'False') {
                ext.dbFS.updateNotesPath(orgDpath, vpath.splitPath(newName), false);
            } else {
                ext.dbFS.dch.deleteDomain(orgDpath);
                ext.dbFS.updateNotesPath(orgDpath, vpath.splitPath(newName), true);
            }
            ext.domainProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.refresh', async () => {
            ext.dbFS = new DatabaseFileSystem(getDbDirPath()); ext.domainProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.delete', async () => {
            const sqp = await window.showQuickPick(['Yes', 'No']);
            if (!sqp) return;
            if (sqp === 'Yes') await ext.dbFS.deleteNote(ext.activeDpath, ext.activeNoteId);
            ext.notesPanelView.parseDomain(ext.activeDpath).showNotesPlanView();
            await commands.executeCommand('setContext', 'vscode-note.note.edit', false);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.files.openTerminal', async () => {
            const nId = ext.activeNoteId!;
            const dpath = ext.activeDpath!;
            const filePath = ext.dbFS.getNoteFilesPath(nId);
            const fileTerminal = window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
            fileTerminal.show(true);
        })
    );
}

export function deactivate() { }
