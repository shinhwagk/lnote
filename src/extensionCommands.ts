import { basename } from 'path';

import { ext } from './extensionVariables';
import { commands, Uri, window } from 'vscode';
import { vpath, vfs } from './helper';
import { noteDocHtmlPanel } from './panel/noteDocHtmlPanel';
import { DomainNode } from './explorer/domainExplorer';
import { ctxFilesExplorer } from './constants';
import { DomainDatabase } from './database';

export namespace ExtCmds {
    export async function cmdHdlNoteEditColAdd(id: string) {
        const cn = ext.domainDB.createNoteCol(id);
        await commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.domainDB.getNoteContentFile(id, cn)));
        // ext.editProvider.refresh();
    }
    export async function cmdHdlNoteEditCol(id: string, cn: string) {
        const rst = await window.showQuickPick(['delete', '------', 'add']);
        if (!rst) return;
        ext.activeNote.id = id;
        if (rst === 'add') {
            await cmdHdlNoteEditColAdd(id);
        } else if (rst === 'delete') {
            await cmdHdlNoteColRemove(id, cn);
        } else {
        }
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteEditColContent(id: string, n: string) {
        const v = Uri.file(ext.domainDB.getNoteContentFile(id, n));
        commands.executeCommand('editExplorer.openFileResource', v);
    }
    export async function cmdHdlNotesCreate(dn: DomainNode) {
        ext.domainDB.dch.createNotes(vpath.splitPath(dn));
        ext.domainProvider.refresh(dn);
        await cmdHdlDomainPin(dn);
        await cmdHdlCategoryAdd(true);
    }
    // export async function cmdHdlNoteEdit(nId: string, category: string) {
    //     const picks = [];
    //     ext.activeNote.id = nId;
    //     ext.activeNote.category = category;
    //     picks.push(ext.dbFS.selectDocExist(nId) ? 'edit doc' : 'create doc');
    //     ext.dbFS.selectFilesExist(nId) || picks.push('create files');
    //     picks.push('category rename');
    //     picks.push('trash');
    //     picks.push('open note folder');
    //     const pick = await window.showQuickPick(picks);
    //     if (!pick) return;
    //     switch (pick) {
    //         case 'create doc':
    //             await cmdHdlNoteEditDocCreate(nId);
    //             break;
    //         case 'edit doc':
    //             await cmdHdlNoteEditDocFull(nId);
    //             break;
    //         case 'create files':
    //             await cmdHdlNoteEditFilesCreate(nId);
    //             break;
    //         case 'category rename':
    //             await cmdHdlNoteEditCategoryRename(nId);
    //             break;
    //         case 'trash':
    //             await cmdHdlNoteEditTrash(nId);
    //             break;
    //         case 'open note folder':
    //             await cmdHdlNoteOpenFolder(nId);
    //             break;
    //     }
    // }
    export async function cmdHdlDomainCreate(dn?: DomainNode) {
        const dpath = dn ? vpath.splitPath(dn) : [];
        const name: string | undefined = await window.showInputBox();
        if (!name) return;
        ext.domainDB.dch.createDomain(dpath, name);
        ext.domainProvider.refresh(dn);
        !dn || ext.domainTreeView.reveal(dn, { expand: true });
    }
    export async function cmdHdlDomainPin(dn: DomainNode) {
        ext.activeNote.domainNode = dn;
        ext.notesPanelView.parseDomain(vpath.splitPath(dn)).showNotesPlanView();
        ext.domainDB.appendLastDomainToShortcuts(dn);
        await ext.setContext(ctxFilesExplorer, false);
    }
    export async function cmdHdlDomainPinLabels(dn: DomainNode) {
        ext.activeNote.domainNode = dn;
        ext.notesPanelView.parseDomain(vpath.splitPath(dn)).showNotesPlanView();
        ext.domainDB.appendLastDomainToShortcuts(dn);
        await ext.setContext(ctxFilesExplorer, false);
    }
    export async function cmdHdlNoteColRemove(id: string, cn: string) {
        console.log(id, cn);
        //cn : column number
        if (ext.domainDB.getNoteContentFiles(id).length === 1) {
            window.showInformationMessage("don't remove short document if only one.");
            return;
        }
        ext.domainDB.deleteNoteCol(id, Number(cn));
        cmdHdlDomainPin(ext.activeNote.domainNode);
    }
    export async function cmdHdlNoteEditRemove() {
        const sqp = await window.showQuickPick(['Yes', 'No']);
        if (!sqp || sqp === 'No') return;
        ext.domainDB.dch.removeNotes(vpath.splitPath(ext.activeNote.domainNode!), ext.activeNote.id!);
        // ext.dbFS.removeNotes(ext.activeNote.dpath, ext.activeNote.id!);
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlCategoryAdd(useDefault: boolean) {
        let cname: undefined | string = 'default';
        if (!useDefault) {
            cname = await window.showInputBox({ value: 'default' });
            if (!cname) return;
        }
        await cmdHdlNoteAdd(cname);
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteAdd(category: string /*, editFirst: boolean = true*/) {
        const nid: string = ext.domainDB.createNode(vpath.splitPath(ext.activeNote.domainNode!), category);
        vfs.writeFileSync(ext.domainDB.getNoteContentFile(nid, '1'));
        // if (editFirst) {
        //     await commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.domainDB.getNoteContentFile(nid, '1')));
        // }
        ext.domainProvider.refresh(ext.activeNote.domainNode);
    }
    export async function cmdHdlNoteEditFilesCreate(nId: string) {
        ext.domainDB.createNoteFiles(nId);
        ext.notesPanelView.parseDomain().showNotesPlanView();
        await cmdHdlNoteFilesOpen(nId);
    }
    export async function cmdHdlNoteEditFilesClose() {
        await ext.setContext(ctxFilesExplorer, true);
    }
    export async function cmdHdlNoteEditDocCreate(nId: string) {
        ext.domainDB.createNoteDoc(nId);
        await commands.executeCommand(
            'editExplorer.openFileResource',
            Uri.file(ext.domainDB.getNoteDocIndexFile(nId, 'README.md'))
        );
    }
    export async function cmdHdlDomainMove(dn: DomainNode) {
        const orgDpath = vpath.splitPath(dn);
        const newDpathString: string | undefined = await window.showInputBox({ value: orgDpath.join('/') });
        if (!newDpathString || orgDpath.join('/') === newDpathString) return;
        const newDpath = vpath.splitPath(newDpathString);
        resetDomain(orgDpath, newDpath);
        for (let i = 0; i <= orgDpath.length; i++) {
            if (orgDpath[i] !== newDpath[i]) {
                const dpath = newDpath.slice(0, i);
                await ext.domainProvider.refresh(dpath.join('/'));
                await ext.domainTreeView.reveal(newDpath.join('/'));
                break;
            }
        }
        ext.activeNote.dpath = newDpath;
    }
    export async function cmdHdlDomainRename(dn: DomainNode) {
        const orgDpath = vpath.splitPath(dn);
        const orgName = orgDpath[orgDpath.length - 1];
        const newName: string | undefined = await window.showInputBox({ value: orgName });
        if (!newName || orgName == newName) return;
        const newDpath = orgDpath.slice();
        newDpath[newDpath.length - 1] = newName;
        resetDomain(orgDpath, newDpath);
        ext.domainProvider.refresh(orgDpath.slice(0, orgDpath.length - 1).join('/'));
    }
    export async function cmdHdlDomainSearch(_dn: DomainNode) {
        window.showInformationMessage('soon');
    }
    export async function cmdHdlNoteOpenFolder(id: string) {
        await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.getNotePath(id)), true);
    }
    export async function cmdHdlNoteEditCategoryRename(nId: string) {
        const oldCategory = ext.domainDB.readNoteMeta(nId).category;
        const newCname = await window.showInputBox({ value: oldCategory });
        if (newCname === undefined) return;
        ext.domainDB.updateNoteCategory(nId, newCname);
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlCategoryRename(oldCategory: string) {
        const newCategory: string | undefined = await window.showInputBox({ value: oldCategory });
        if (newCategory === undefined) return;
        const dpath = vpath.splitPath(ext.activeNote.domainNode!);
        ext.domainDB.dch
            .selectNotesUnderDomain(dpath)
            .filter((nId) => ext.domainDB.readNoteMeta(nId).category === oldCategory)
            .forEach((nId) => ext.domainDB.updateNoteCategory(nId, newCategory));
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteDocShow(nId: string) {
        const readmeFile = ext.domainDB.selectDocIndexFile(nId);
        if (basename(readmeFile).split('.')[1] === 'md') {
            const uri = Uri.file(readmeFile);
            await commands.executeCommand('markdown.showPreviewToSide', uri);
        } else {
            noteDocHtmlPanel(readmeFile);
        }
    }
    export async function cmdHdlNoteFilesOpen(nId: string) {
        ext.activeNote.id = nId;
        ext.filesProvider.refresh();
        await ext.setContext(ctxFilesExplorer, true);
    }
    export async function cmdHdlFilesClose() {
        await ext.setContext(ctxFilesExplorer, false);
    }
    export async function cmdHdlFilesEditOpen() {
        await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.getNoteFilesPath(ext.activeNote.id)), true);
    }
    export async function cmdHdlFilesRefresh() {
        ext.filesProvider.refresh();
    }
    export async function cmdHdlFilesOpenTerminal() {
        const nId = ext.activeNote.id;
        const dpath = vpath.splitPath(ext.activeNote.domainNode!);
        const filePath = ext.domainDB.getNoteFilesPath(nId);
        const fileTerminal = window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
        fileTerminal.show(true);
    }
    export async function cmdHdlDomainRefresh() {
        ext.domainDB = new DomainDatabase(ext.notesPath);
        ext.domainDB.refresh();
        window.showInformationMessage('refreshDomain success.');
        ext.domainProvider.refresh();
    }
    export async function cmdHdlNoteEditDocFull(id: string) {
        await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.getNoteDocPath(id)), true);
    }
    // export async function cmdHdlCategoryEdit(category: string) {
    //     const rst = await window.showQuickPick(['rename', 'move to other domain']);
    //     if (rst === 'move to other domain') {
    //         await CategoryMoveToDomain(category);
    //         ext.domainProvider.refresh();
    //     } else if (rst === 'rename') {
    //         await CategoryRename(category);
    //         ext.domainProvider.refresh();
    //     } else {
    //         return;
    //     }
    // }
    export async function cmdHdShortcutsLast() {
        const picks = ext.domainDB.getShortcutsList('last');
        const pick = await window.showQuickPick(picks);
        if (!pick) return;
        await cmdHdlDomainPin(pick);
    }
    export async function cmdHdlNoteEditTrash(id: string) {
        const dpath = vpath.splitPath(ext.activeNote.domainNode);
        ext.domainDB.updateNoteDomain(id, dpath, ['@Trash'].concat(dpath), false);
        cmdHdlDomainRefresh();
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteColToActiveTermianl(nid: string, cidx: string) {
        if (window.activeTerminal) {
            const colContent = ext.domainDB.selectNoteContents(nid)[Number(cidx)];
            window.activeTerminal.sendText(colContent);
        }
    }
    export async function cmdHdlNoteColToActiveTermianlWithArgs(nid: string, cidx: string) {
        if (window.activeTerminal) {
            const colContent = ext.domainDB.selectNoteContents(nid)[Number(cidx)];
            window.activeTerminal.sendText(colContent);
        }
    }
    export async function cmdHdlCategoryMoveToDomain(category: string) {
        const name: string | undefined = await window.showInputBox({ value: ext.activeNote.domainNode! });
        if (name === undefined) return;
        if (name === ext.activeNote.domainNode!) return;
        const newDpath = vpath.splitPath(name);
        ext.domainDB.dch
            .selectNotesUnderDomain(vpath.splitPath(ext.activeNote.domainNode!))
            .filter((nId) => ext.domainDB.readNoteMeta(nId).category === category)
            .forEach((nId) => {
                ext.domainDB.updateNoteDomain(nId, vpath.splitPath(ext.activeNote.domainNode!), newDpath, false);
                ext.domainDB.dch.removeNotes(vpath.splitPath(ext.activeNote.domainNode!), nId);
                ext.domainDB.dch.cacheNote(newDpath, nId);
            });
        ext.notesPanelView.parseDomain().showNotesPlanView();
        ext.domainProvider.refresh();
    }
    export function resetDomain(orgDpath: string[], newDpath: string[]) {
        ext.domainDB.updateNotesDomain(orgDpath, newDpath, true);
        const notes = ext.domainDB.dch.selectAllNotesUnderDomain(orgDpath);
        ext.domainDB.dch.deleteDomain(orgDpath);
        ext.domainDB.cacheValidNotes(...notes);
        ext.notesPanelView.parseDomain(newDpath).showNotesPlanView();
    }
}
