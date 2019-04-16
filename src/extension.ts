import { ext, initializeExtensionVariables } from './extensionVariables';
import {
    ExtensionContext,
    ViewColumn,
    commands,
    window,
    Uri
} from 'vscode';
import { ExtCmds } from './extensionCommands';
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
    registerCommand('vscode-note.domain.refresh', ExtCmds.cmdHdlDomainRefresh);
    /**
     * notes view
     */
    registerCommand('vscode-note.category.add', ExtCmds.cmdHdlCategoryAdd);
    registerCommand('vscode-note.note.files.open', ExtCmds.cmdHdlNoteFilesOpen);
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
    registerCommand('vscode-note.note.edit.doc.full', ExtCmds.cmdHdlNoteEditDocFull);
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
            ext.ga('installed', 'open it');
            ext.notesPanelView.parseDomain(['powershell', 'install']).showNotesPlanView();
        } else {
            ext.ga('installed', 'not now');
        }
    }
    registerCommand('editExplorer.openFileResource', async (uri: Uri) => {
        commands.executeCommand('vscode.open', uri, ViewColumn.Two);
    })

    ext.ga('vscode-note', 'activate');
}

function registerCommand(command: string, callback: (...args: any[]) => any, thisArg?: any) {
    ext.context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
}

export function deactivate() {
    ext.ga('vscode-note', 'deactivate');
}
