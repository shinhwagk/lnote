import { commands, ExtensionContext, ViewColumn } from 'vscode';

import { ExtCmds } from './extensionCommands';
import {
   ext,
   initializeExtensionVariables,
   listenConfiguration,
   listenEditFileClose,
   listenEditFileSave,
   listenVscodeWindowChange
} from './extensionVariables';

export async function activate(context: ExtensionContext) {
   console.log('vscode extension "lnote" is now active!');

   listenConfiguration(context);
   listenEditFileSave(context);
   listenEditFileClose(context);

   initializeExtensionVariables(context);

   listenVscodeWindowChange();


   ext.registerCommand('lnote.choose-location', ExtCmds.cmdHdlChooseLocation);

   /**
    * domain
    */
   ext.registerCommand('lnote.domain.create', ExtCmds.cmdHdlDomainCreate);
   ext.registerCommand('lnote.domain.pin', ExtCmds.cmdHdlDomainPin);
   // ext.registerCommand('lnote.domain.rename', ExtCmds.cmdHdlDomainRename);
   // ext.registerCommand('lnote.domain.remove', ExtCmds.cmdHdlDomainRemove);
   ext.registerCommand('lnote.domain.search', ExtCmds.cmdHdlDomainSearch);
   ext.registerCommand('lnote.domain.notes.create', ExtCmds.cmdHdlDomainNotesCreate);
   ext.registerCommand('lnote.domain.refresh', ExtCmds.cmdHdlDomainRefresh);

   /**
    * notes view
    */
   ext.registerCommand('lnote.note.files.open', ExtCmds.cmdHdlNoteFilesOpen);
   ext.registerCommand('lnote.note.doc.show', ExtCmds.cmdHdlNotebookNoteDocShow);
   ext.registerCommand('lnote.note.edit.openFolder', ExtCmds.cmdHdlNoteOpenFolder);
   // ext.registerCommand('lnote.note.add', ExtCmds.cmdHdlNoteCreate);
   /**
      * note
      */
   // ext.registerCommand('lnote.note.edit.delete', ExtCmds.cmdHdlNoteEditRemove);
   // ext.registerCommand('lnote.note.edit.col', ExtCmds.cmdHdlNoteEditCol);
   // ext.registerCommand('lnote.note.edit.col.content', ExtCmds.cmdHdlNoteEditColContent);
   // ext.registerCommand('lnote.note.edit.col.add', ExtCmds.cmdHdlNoteEditColAdd);
   // ext.registerCommand('lnote.note.edit.col.remove', ExtCmds.cmdHdlNoteColRemove);
   // ext.registerCommand('lnote.note.edit.openFolder', ExtCmds.cmdHdlNoteOpenFolder);
   // ext.registerCommand('lnote.note.edit.category.rename', ExtCmds.cmdHdlNoteEditCategoryRename);
   // ext.registerCommand('lnote.note.edit.files.create', ExtCmds.cmdHdlNoteEditFilesCreate);
   // ext.registerCommand('lnote.note.edit.doc.create', ExtCmds.cmdHdlNoteEditDocCreate);
   // ext.registerCommand('lnote.note.edit.doc.full', ExtCmds.cmdHdlNoteEditDocFull);

   /**
    * note files
    */
   ext.registerCommand('lnote.files.close', ExtCmds.cmdHdlFilesClose);
   ext.registerCommand('lnote.files.open', ExtCmds.cmdHdlFilesOpen);
   ext.registerCommand('lnote.files.openerminal', ExtCmds.cmdHdlFilesOpenTerminal);
   ext.registerCommand('lnote.files.refresh', ExtCmds.cmdHdlFilesRefresh);
   /**
      *  extension
      */
   // if (checkFirst) {
   //     if ((await window.showInformationMessage('lnote installed.', 'Open it.', 'Not now.')) === 'Open it.') {
   //         commands.executeCommand('workbench.view.extension.vsnote-explorer');
   //         ext.notesPanelView.parseDomain(['powershell', 'install']).showNotesPlanView();
   //     }
   // }

   /**
      * shortcutes
      */
   // ext.registerCommand('lnote.shortcuts.last', ExtCmds.cmdHdShortcutsLast);

   ext.registerCommand('editExplorer.openFileResource', async (resource: any) => {
      await commands.executeCommand('vscode.open', resource, ViewColumn.Two);
   });
}

export function deactivate() { }
