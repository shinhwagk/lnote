import { ext } from './extensionVariables';
import { commands, Uri, window } from 'vscode';
import { DomainNode } from './explorer/domainExplorer';
import { GA } from './ga';

export namespace ExtCmds {
    export async function cmdHdlNoteEditColAdd() {
        const id = ext.dbFS.createNoteCol(ext.activeNote.id);
        await commands.executeCommand(
            'editExplorer.openFileResource',
            Uri.file(ext.dbFS.getNoteContentFile(ext.activeNote.id, id))
        );
        ext.editProvider.refresh();
        GA.collect('note', 'col-add');
    }
    export async function cmdHdlNotesCreate(dn: DomainNode) {
        ext.dbFS.dch.createNotes(dn.dpath);
        ext.domainProvider.refresh(dn);
        commands.executeCommand('vscode-note.domain.pin', dn.dpath);
    }
    export async function cmdHdlNoteEdit(nId: string, category: string) {
        window.showInformationMessage(category + nId);
        ext.activeNote.id = nId;
        ext.activeNote.category = category;
        ext.editProvider.refresh();
        await commands.executeCommand('setContext', 'vscode-note.note.edit-explorer', true);
        GA.collect('note', 'edit');
    }
}

namespace ExtCmdsFuns {
    export async function addCol(nId: string) {
        const id = ext.dbFS.createNoteCol(nId);
        await commands.executeCommand(
            'editExplorer.openFileResource',
            Uri.file(ext.dbFS.getNoteContentFile(nId, id))
        );
    }

    export async function renameCategory(
        dpath: string,
        nId: string,
        orgCategory: string,
        newCategory: string
    ) {}

    export async function deleteNote(nId: string) {
        const pick = await window.showQuickPick(['True', 'False'], { placeHolder: `Delete ${nId}?` });
        if (!pick || pick === 'False') return;
    }

    export async function addFiles(nId: string) {
        ext.dbFS.createNoteFiles(nId);
        editFiles(nId);
    }

    export async function editFiles(nId: string) {
        await commands.executeCommand('vscode.openFolder', Uri.file(ext.dbFS.getNoteFilesPath(nId)), true);
    }
}
