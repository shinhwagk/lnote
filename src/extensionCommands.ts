import { ext } from './extensionVariables';
import { commands, Uri, window, TreeItem } from 'vscode';
import { DomainNode } from './explorer/domainExplorer';
import { ensureFileSync } from 'fs-extra';
import { vpath } from './helper';
import { basename } from 'path';
import { noteDocHtmlPanel } from './panel/noteDocHtmlPanel';

export namespace ExtCmds {
    export async function cmdHdlNoteEditColAdd() {
        const id = ext.dbFS.createNoteCol(ext.activeNote.id);
        await commands.executeCommand(
            'editExplorer.openFileResource',
            Uri.file(ext.dbFS.getNoteContentFile(ext.activeNote.id, id))
        );
        ext.editProvider.refresh();
        ext.ga('note', 'col-add');
    }
    export async function cmdHdlNotesCreate(dn: DomainNode) {
        ext.dbFS.dch.createNotes(dn.dpath);
        ext.domainProvider.refresh(dn);
        commands.executeCommand('vscode-note.domain.pin', dn.dpath);
        ext.ga('notes', 'create');
    }
    export async function cmdHdlNoteEditOpen(nId: string, category: string) {
        ext.activeNote.id = nId;
        ext.activeNote.category = category;
        ext.editProvider.refresh();
        const docExist = ext.dbFS.selectDocExist(nId);
        await commands.executeCommand('setContext', 'vscode-note.note.doc.exist', docExist);

        const filesExist = ext.dbFS.selectFilesExist(nId);
        await commands.executeCommand('setContext', 'vscode-note.note.files.exist', filesExist);

        await commands.executeCommand('setContext', 'vscode-note.edit-explorer', true);
        await commands.executeCommand('setContext', 'vscode-note.files-explorer', false);
        ext.ga('note', 'edit-open');
    }
    export async function cmdHdlDomainCreate(dn?: DomainNode) {
        const dpath = dn ? dn.dpath : [];
        const name: string | undefined = await window.showInputBox();
        if (!name) return;
        ext.dbFS.dch.createDomain(dpath, name);
        ext.domainProvider.refresh(dn);
        !dn || ext.domainTreeView.reveal(dn, { expand: true });
        ext.ga('domain', 'create');
    }
    export async function cmdHdlDomainPin(dn: DomainNode) {
        ext.activeNote.domainNode = dn;
        ext.notesPanelView.parseDomain(dn.dpath).showNotesPlanView();
        ext.ga('notes', 'view');
    }
    export async function cmdHdlNoteEditClose() {
        await commands.executeCommand('setContext', 'vscode-note.edit-explorer', false);
        ext.notesPanelView.parseDomain().showNotesPlanView();
        ext.ga('note', 'edit-close');
    }
    export async function cmdHdlNoteColRemove(f: TreeItem) {
        const nu = basename(f.resourceUri!.fsPath)[0];
        ext.dbFS.deleteNoteCol(ext.activeNote.id, Number(nu));
        ext.editProvider.refresh();
        ext.ga('note', 'col-delete');
    }
    export async function cmdHdlNoteEditRemove() {
        const sqp = await window.showQuickPick(['Yes', 'No']);
        if (!sqp || sqp === 'No') return;
        ext.dbFS.dch.removeNotes(ext.activeNote.domainNode!.dpath, ext.activeNote.id!);
        // ext.dbFS.removeNotes(ext.activeNote.dpath, ext.activeNote.id!);
        ext.notesPanelView.parseDomain().showNotesPlanView();
        await commands.executeCommand('setContext', 'vscode-note.edit-explorer', false);
    }
    export async function cmdHdlCategoryAdd() {
        const cname: string | undefined = await window.showInputBox({ value: 'default' });
        if (!cname) return;
        ext.notesPanelView
            .parseDomain()
            .addCategory(cname)
            .showNotesPlanView();
        ext.ga('category', 'add');
    }
    export async function cmdHdlNoteAdd(category: string) {
        const nid: string = ext.dbFS.createNode(ext.activeNote.domainNode!.dpath, category);
        ensureFileSync(ext.dbFS.getNoteContentFile(nid, '1'));
        await commands.executeCommand(
            'editExplorer.openFileResource',
            Uri.file(ext.dbFS.getNoteContentFile(nid, '1'))
        );
        ext.domainProvider.refresh(ext.activeNote.domainNode);
        ext.ga('note', 'add');
    }
    export async function cmdHdlNoteEditFilesCreate() {
        ext.dbFS.createNoteFiles(ext.activeNote.id);
        ext.notesPanelView.parseDomain().showNotesPlanView();
        await commands.executeCommand('setContext', 'vscode-note.note.files.exist', true);
        await cmdHdlNoteFilesShow(ext.activeNote.id);
    }
    export async function cmdHdlNoteEditFilesClose() {
        await commands.executeCommand('setContext', 'vscode-note.files-explorer', false);
    }
    export async function cmdHdlNoteEditDocCreate() {
        ext.dbFS.createNoteDoc(ext.activeNote.id);
        await commands.executeCommand(
            'editExplorer.openFileResource',
            Uri.file(ext.dbFS.getNoteDocIndexFile(ext.activeNote.id, 'README.md'))
        );
        await commands.executeCommand('setContext', 'vscode-note.note.doc.exist', true);
    }
    export async function cmdHdlDomainMove(dn: DomainNode) {
        const orgDpath = dn.dpath;
        const newDpath: string | undefined = await window.showInputBox({ value: orgDpath.join('/') });
        if (!newDpath) return;
        ExtCmdsFuns.resetDomain(orgDpath, vpath.splitPath(newDpath));
        // ext.domainProvider.refresh(vpath.splitPath(newDpath), true);
        ext.domainProvider.refresh(dn);
        ext.ga('domain', 'move');
    }
    export async function cmdHdlDomainRename(dn: DomainNode) {
        const orgDpath = dn.dpath;
        const orgName = orgDpath[orgDpath.length - 1];
        const newName: string | undefined = await window.showInputBox({ value: orgName });
        if (!newName || orgName == newName) return;
        const newDpath = orgDpath.slice();
        newDpath[newDpath.length - 1] = newName;
        ExtCmdsFuns.resetDomain(orgDpath, newDpath);
        ext.domainProvider.refresh(dn.getParent()!);
        ext.ga('domain', 'rename');
    }
    export async function cmdHdlNoteOpenFolder() {
        await commands.executeCommand(
            'vscode.openFolder',
            Uri.file(ext.dbFS.getNotePath(ext.activeNote.id)),
            true
        );
    }
    export async function cmdHdlNoteEditCategoryRename() {
        const newCname = await window.showInputBox({ value: ext.activeNote.category });
        if (!newCname) return;
    }
    export async function cmdHdlNoteDocShow(nId: string) {
        const readmeFile = ext.dbFS.selectDocIndexFile(nId);
        if (basename(readmeFile).split('.')[1] === 'md') {
            const uri = Uri.file(readmeFile);
            await commands.executeCommand('markdown.showPreviewToSide', uri);
        } else {
            noteDocHtmlPanel(readmeFile);
        }
    }
    export async function cmdHdlNoteFilesShow(nId: string) {
        ext.activeNote.id = nId;
        ext.filesProvider.refresh();
        await commands.executeCommand('setContext', 'vscode-note.files-explorer', true);
    }
    export async function cmdHdlFilesClose() {
        await commands.executeCommand('setContext', 'vscode-note.files-explorer', false);
    }
    export async function cmdHdlFilesEditOpen() {
        await commands.executeCommand(
            'vscode.openFolder',
            Uri.file(ext.dbFS.getNoteFilesPath(ext.activeNote.id)),
            true
        );
    }
    export async function cmdHdlFilesRefresh() {
        ext.filesProvider.refresh();
    }
    export async function cmdHdlFilesOpenTerminal() {
        const nId = ext.activeNote.id;
        const dpath = ext.activeNote.domainNode!.dpath;
        const filePath = ext.dbFS.getNoteFilesPath(nId);
        const fileTerminal = window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
        fileTerminal.show(true);
    }

}


namespace ExtCmdsFuns {


    // export async function renameCategory(
    //     dpath: string,
    //     nId: string,
    //     orgCategory: string,
    //     newCategory: string
    // ) { }

    export function resetDomain(orgDpath: string[], newDpath: string[]) {
        ext.dbFS.updateNotesPath(orgDpath, newDpath, true);
        const notes = ext.dbFS.dch.selectAllNotesUnderDomain(orgDpath);
        ext.dbFS.dch.deleteDomain(orgDpath);
        ext.dbFS.insertNotesByMeta(...notes);
        ext.notesPanelView.parseDomain(newDpath).showNotesPlanView();
    }
}
