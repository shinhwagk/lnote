import { removeSync, ensureFileSync } from 'fs-extra';
import * as path from 'path';
import { DomainNode } from './explorer/domainExplorer';
import { ext, initializeExtensionVariables, getDbDirPath } from './extensionVariables';
import { noteDocHtmlPanel } from './panel/noteDocHtmlPanel';
import { vscodeConfigSection } from './constants';
import {
    ExtensionContext,
    ConfigurationChangeEvent,
    ViewColumn,
    commands,
    workspace,
    Uri,
    window,
    TreeItem
} from 'vscode';
import { DatabaseFileSystem } from './database';
import { vpath } from './helper';
import { ExtCmds } from './extensionCommands';
import { GA } from './ga';

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
            await commands.executeCommand(
                'openFolder',
                Uri.file(ext.dbFS.getNotePath(ext.activeNote.id!!)),
                true
            );
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
            ext.activeNote.id! = nId;
            ext.filesProvider.refresh();
            await commands.executeCommand('setContext', 'vscode-note.note.files', true);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.add', async (category: string) => {
            const nid: string = ext.dbFS.createNode(ext.activeNote.dpath, category);
            ensureFileSync(ext.dbFS.getNoteContentFile(nid, '1'));
            await commands.executeCommand(
                'editExplorer.openFileResource',
                Uri.file(ext.dbFS.getNoteContentFile(nid, '1'))
            );
            GA.collect('note', 'add');
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.category.add', async () => {
            const cname: string | undefined = await window.showInputBox({ value: 'default' });
            if (!cname) return;
            ext.notesPanelView
                .parseDomain()
                .addCategory(cname)
                .showNotesPlanView();
            GA.collect('category', 'add');
        })
    );

    registerCommand('vscode-note.note.edit', ExtCmds.cmdHdlNoteEdit);
    registerCommand('vscode-note.note.edit.col.add', ExtCmds.cmdHdlNoteEditColAdd);
    registerCommand('vscode-note.notes.create', ExtCmds.cmdHdlNotesCreate);

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.edit.close', async () => {
            await commands.executeCommand('setContext', 'vscode-note.note.edit-explorer', false);
            // ext.notesPanelView.parseDomain(ext.activeNote.dpath).showNotesPlanView();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.files.close', async () => {
            await commands.executeCommand('setContext', 'vscode-note.note.files', false);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.edit.files', async () => {
            // await commands.executeCommand('setContext', 'vscode-note.note.files', false);
        })
    );
    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.edit.doc', async () => {
            // await commands.executeCommand('setContext', 'vscode-note.note.files', false);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.edit.col.remove', async (f: TreeItem) => {
            removeSync(f.resourceUri!.fsPath);
            ext.editProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.pin', async (dpath: string[]) => {
            ext.activeNote.dpath = dpath;
            ext.notesPanelView.parseDomain().showNotesPlanView();
            GA.collect('notes', 'view');
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.create', async (dn?: DomainNode) => {
            const dpath = dn ? dn.dpath : [];
            const name: string | undefined = await window.showInputBox();
            if (!name) return;
            ext.dbFS.dch.createDomain(dpath, name);
            ext.domainProvider.refresh(dn);
            GA.collect('domain', 'create');
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
            ext.dbFS.updateNotesPath(orgDpath, newDpath, false);
            const notes = ext.dbFS.dch.selectNotesUnderDomain(orgDpath);
            ext.dbFS.dch.deleteDomain(orgDpath);
            ext.dbFS.insertNotesByMeta(...notes);
            ext.domainProvider.refresh(dn, true);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.move', async (dn: DomainNode) => {
            const orgDpath = dn.dpath;
            const newName: string | undefined = await window.showInputBox({ value: orgDpath.join('/') });
            const cascade = await window.showQuickPick(['True', 'False']);
            if (!newName || !cascade) return;
            let notes = [];
            if (cascade === 'False') {
                ext.dbFS.updateNotesPath(orgDpath, vpath.splitPath(newName), false);
                notes = ext.dbFS.dch.selectNotesUnderDomain(orgDpath);
            } else {
                ext.dbFS.updateNotesPath(orgDpath, vpath.splitPath(newName), true);
                notes = ext.dbFS.dch.selectAllNotesUnderDomain(orgDpath);
            }
            ext.dbFS.dch.deleteDomain(orgDpath);
            ext.dbFS.insertNotesByMeta(...notes);
            ext.domainProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.refresh', async () => {
            ext.dbFS = new DatabaseFileSystem(getDbDirPath());
            ext.domainProvider.refresh();
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.delete', async () => {
            const sqp = await window.showQuickPick(['Yes', 'No']);
            if (!sqp || sqp === 'No') return;
            ext.dbFS.dch.removeNotes(ext.activeNote.dpath!, ext.activeNote.id!);
            // ext.dbFS.removeNotes(ext.activeNote.dpath, ext.activeNote.id!);
            ext.notesPanelView.parseDomain().showNotesPlanView();
            await commands.executeCommand('setContext', 'vscode-note.note.edit-explorer', false);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.note.files.openTerminal', async () => {
            const nId = ext.activeNote.id!!;
            const dpath = ext.activeNote.dpath!;
            const filePath = ext.dbFS.getNoteFilesPath(nId);
            const fileTerminal = window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
            fileTerminal.show(true);
        })
    );
}

function registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any) {
    ext.context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
}

// function editNotesAction(name: string, nId: string) {
//     const xx = ['add Col', 'add Doc', 'add Files', 'edit Doc', 'edit Files', 'delete Col'];
// }
export function deactivate() {}
