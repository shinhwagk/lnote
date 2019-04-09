import { ext, initializeExtensionVariables } from './extensionVariables';
import {
    ExtensionContext,
    ViewColumn,
    commands,
    window
} from 'vscode';
import { ExtCmds } from './extensionCommands';
import { DatabaseFileSystem } from './database';
import { checkFirst } from './ga';

export async function activate(context: ExtensionContext) {
    console.log('vscode extension "vscode-note" is now active!');

    initializeExtensionVariables(context);

    /**
     * domain
     */
    registerCommand('vscode-note.domain.create', ExtCmds.cmdHdlDomainCreate);
    registerCommand('vscode-note.domain.pin', ExtCmds.cmdHdlDomainPin);
    registerCommand('vscode-note.domain.move', ExtCmds.cmdHdlDomainMove);
    registerCommand('vscode-note.domain.rename', ExtCmds.cmdHdlDomainRename);
    registerCommand('vscode-note.notes.create', ExtCmds.cmdHdlNotesCreate);
    /**
     * notes view
     */
    registerCommand('vscode-note.category.add', ExtCmds.cmdHdlCategoryAdd);
    registerCommand('vscode-note.note.files.show', ExtCmds.cmdHdlNoteFilesShow);
    registerCommand('vscode-note.note.doc.show', ExtCmds.cmdHdlNoteDocShow);
    registerCommand('vscode-note.note.add', ExtCmds.cmdHdlNoteAdd);
    /**
     * note
     */
    registerCommand('vscode-note.note.edit.delete', ExtCmds.cmdHdlNoteEditRemove);
    registerCommand('vscode-note.note.edit.open', ExtCmds.cmdHdlNoteEditOpen);
    registerCommand('vscode-note.note.edit.close', ExtCmds.cmdHdlNoteEditClose);
    registerCommand('vscode-note.note.edit.col.add', ExtCmds.cmdHdlNoteEditColAdd);
    registerCommand('vscode-note.note.edit.col.remove', ExtCmds.cmdHdlNoteColRemove);
    registerCommand('vscode-note.note.edit.openFolder', ExtCmds.cmdHdlNoteOpenFolder);
    registerCommand('vscode-note.note.edit.category.rename', ExtCmds.cmdHdlNoteEditCategoryRename);
    registerCommand('vscode-note.note.edit.files.create', ExtCmds.cmdHdlNoteEditFilesCreate);
    registerCommand('vscode-note.note.edit.doc.create', ExtCmds.cmdHdlNoteEditDocCreate);
    /**
     * note files
     */
    registerCommand('vscode-note.files.close', ExtCmds.cmdHdlFilesClose);
    registerCommand('vscode-note.files.edit.open', ExtCmds.cmdHdlFilesEditOpen);
    registerCommand('vscode-note.files.openTerminal', ExtCmds.cmdHdlFilesOpenTerminal);
    registerCommand('vscode-note.files.refresh', ExtCmds.cmdHdlFilesRefresh);
    /**
     *  extension
     */
    if (checkFirst) {
        if (await window.showInformationMessage('vscode-note installed.', 'Open it.', 'Not now.') === 'Open it.') {
            commands.executeCommand('workbench.view.extension.vsnote-explorer');
            ext.ga('installed', 'open it')
        } else {
            ext.ga('installed', 'not now')
        }
    }

    context.subscriptions.push(
        commands.registerCommand('editExplorer.openFileResource', async (resource: any) => {
            commands.executeCommand('vscode.open', resource, ViewColumn.Two);
        })
    );

    context.subscriptions.push(
        commands.registerCommand('vscode-note.domain.refresh', async () => {
            ext.dbFS = new DatabaseFileSystem(ext.dbDirPath);
            ext.domainProvider.refresh();
        })
    );

    ext.ga('vscode-note', 'activate');
}

function registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any) {
    ext.context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
}

export function deactivate() {
    ext.ga('vscode-note', 'deactivate');
}
