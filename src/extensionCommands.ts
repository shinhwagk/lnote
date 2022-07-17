import { basename } from 'path';

import { commands, Uri, window, workspace } from 'vscode';

import { ext } from './extensionVariables';
import { noteDocHtmlPanel } from './panel/noteDocHtmlPanel';
import { DomainNode } from './explorer/domainExplorer';
import { ctxFilesExplorer, section } from './constants';
import { NoteBookDatabase } from './database';
import { tools } from './helper';
import { existsSync, statSync } from 'fs-extra';

export namespace ExtCmds {
    export async function cmdHdlChooseLocation() {
        // { title: 'choose vscode-note data location.' }
        const dl = await window.showInputBox();
        if (dl === undefined || dl === '') return;
        if (!existsSync(dl) || !statSync(dl).isDirectory()) {
            window.showInformationMessage('Make sure the directory already exists.');
        }
        workspace.getConfiguration(section).update('notespath', dl, 1);
    }
    export async function cmdHdlNoteEditShortDocument(nId: string) {
        const domainNode: string[] = tools.splitDomaiNode(ext.globalState.domainNode!);
        ext.notesDatabase.getCategoriesOfDomain(domainNode)
        // const cn = ext.domainDB.addCol(nId);
        // await commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.domainDB.noteDB.getContentFile(nId, cn)));
        // ext.editProvider.refresh();
    }
    export async function cmdHdlNoteEditContent(nId: string) {
        const domainNode: string[] = tools.splitDomaiNode(ext.globalState.domainNode!);
        const noteEditFile = ext.notesDatabase.createEditNoteEnv(domainNode[0], nId)
        const v = Uri.file(noteEditFile);
        ext.editNotes.set(nId, domainNode)
        commands.executeCommand('editExplorer.openFileResource', v);
    }
    export async function cmdHdlDomainNotesCreate(dn: DomainNode) {
        ext.globalState.domainNode = dn;
        // ext.domainDB.createDomain(tools.splitDomaiNode(dn))
        // ext.domainDB.createNotes(tools.splitDomaiNode(dn));
        // ext.domainProvider.refresh(dn);
        const domainNode = tools.splitDomaiNode(dn);
        await cmdHdlDomainCategoryAdd(true);
        // await cmdHdlDomainPin(dn);
        ext.domainProvider.refresh(dn);
        // ext.notesPanelView.parseDomain(tools.splitDomaiNode(domainNode)).showNotesPlanView();
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
        const _dn: string[] = dn ? tools.splitDomaiNode(dn) : [];
        const name: string | undefined = await window.showInputBox();
        if (!name) return;
        ext.notesDatabase.createDomain(_dn.concat(name));
        ext.domainProvider.refresh(dn);
        !dn || ext.domainTreeView.reveal(dn, { expand: true });
    }
    export async function cmdHdlDomainPin(dn: DomainNode) {
        ext.globalState.domainNode = dn;
        ext.notesDatabase.cacheNoteBook(tools.splitDomaiNode(dn)[0])
        // ext.domainDB.refresh(tools.splitDomaiNode(dn), true);
        ext.notesPanelView.parseDomain(tools.splitDomaiNode(dn)).showNotesPlanView();
        await ext.setContext(ctxFilesExplorer, false);
    }
    // export async function cmdHdlNoteEditRemove() {
    //     const sqp = await window.showQuickPick(['Yes', 'No']);
    //     if (!sqp || sqp === 'No') return;
    //     ext.domainDB.removeNotes(tools.splitDomaiNode(ext.activeNote.dn!), ext.activeNote.nId!);
    //     // ext.dbFS.removeNotes(ext.activeNote.dpath, ext.activeNote.id!);
    //     ext.notesPanelView.parseDomain().showNotesPlanView();
    // }
    export async function cmdHdlDomainCategoryAdd(useDefault: boolean) {
        let cname: undefined | string = 'default';
        if (!useDefault) {
            cname = await window.showInputBox({ value: 'default' });
            if (!cname) return;
        }
        console.log(cname)
        ext.notesDatabase.createCategory(tools.splitDomaiNode(ext.globalState.domainNode), cname)
        await cmdHdlNoteAdd(cname);
    }
    export async function cmdHdlCategoryRemove(category: string) {
        // const confirm = await window.showInputBox({
        //     title: 'Are you absolutely sure?',
        //     placeHolder: `Please type ${category} to confirm.`,
        // });
        // if (confirm !== category) {
        //     window.showInformationMessage(`Input is not '${category}'.`);
        //     return;
        // } else {
        //     if ((await window.showInformationMessage(`Remove category '${category}'?`, 'Yes', 'No')) !== 'Yes') return;
        // }
        // const domainNode: string[] = tools.splitDomaiNode(ext.globalState.domainNode!);
        // const nIds = ext.domainDB.getDomainNotes(domainNode);
        // nIds.filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === category).forEach((nId) => {
        //     ext.domainDB.noteDB.removeFromCache(nId);
        //     ext.domainDB.noteDB.remove(nId);
        // });
        // ext.domainDB.refreshDomainNodes(domainNode, true);
        // ext.domainProvider.refresh();
        // ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteAdd(category: string) {
        const domainNode: string[] = tools.splitDomaiNode(ext.globalState.domainNode!);
        const nId = ext.notesDatabase.addNote(domainNode, category);
        cmdHdlNoteEditContent(nId)
        ext.notesDatabase.refresh(domainNode);
        ext.domainProvider.refresh(ext.globalState.domainNode);
        ext.notesPanelView.parseDomain(domainNode).showNotesPlanView();
    }
    export async function cmdHdlNoteFilesCreate(nId: string) {
        // ext.domainDB.noteDB.createFiles(nId);
        // ext.notesPanelView.parseDomain().showNotesPlanView();
        // await cmdHdlNoteFilesOpen(nId);
    }
    export async function cmdHdlNoteEditFilesClose() {
        await ext.setContext(ctxFilesExplorer, true);
    }
    export async function cmdHdlNoteDocCreate(nId: string) {
        // ext.domainDB.noteDB.createDoc(nId);
        // await commands.executeCommand(
        //     'editExplorer.openFileResource',
        //     Uri.file(ext.domainDB.noteDB.getDocIndexFile(nId, 'README.md'))
        // );
    }
    // export async function cmdHdlDomainMove(dn: DomainNode) {
    //     // const orgDpath = tools.splitDomaiNode(dn);
    //     // const newDpathString: string | undefined = await window.showInputBox({ value: orgDpath.join('/') });
    //     // if (!newDpathString || orgDpath.join('/') === newDpathString) return;
    //     // const newDpath = tools.splitDomaiNode(newDpathString);
    //     // // resetDomain(orgDpath, newDpath);
    //     // for (let i = 0; i <= orgDpath.length; i++) {
    //     //     if (orgDpath[i] !== newDpath[i]) {
    //     //         const dpath = newDpath.slice(0, i);
    //     //         await ext.domainProvider.refresh(dpath.join('/'));
    //     //         await ext.domainTreeView.reveal(newDpath.join('/'));
    //     //         break;
    //     //     }
    //     // }
    //     // ext.globalState.dpath = newDpath;
    // }
    // export async function cmdHdlDomainRename(dn: DomainNode) {
    //     const _dn = tools.splitDomaiNode(dn);
    //     window.showWarningMessage('sonn.')
    //     // const orgName = _dn[_dn.length - 1];
    //     // const newName: string | undefined = await window.showInputBox({ value: orgName });
    //     // if (!newName || orgName == newName) return;
    //     // const newDpath = _dn.slice();
    //     // newDpath[newDpath.length - 1] = newName;
    //     // // resetDomain(orgDpath, newDpath);
    //     // ext.domainProvider.refresh(_dn.slice(0, _dn.length - 1).join('/'));
    // }
    export async function cmdHdlDomainRemove(dn: DomainNode) {
        const _dn = tools.splitDomaiNode(dn);
        const domainName = _dn[_dn.length - 1];
        const confirm = await window.showInputBox({
            title: 'Are you absolutely sure?',
            placeHolder: `Please type '${domainName}' or '${domainName} with notes' to confirm.`,
        });
        let withNotes = false;
        if (confirm !== domainName) {
            window.showInformationMessage(`Input is not '${domainName}'.`);
            return;
        } else if (confirm === `${domainName} with notes`) {
            if ((await window.showInformationMessage(`Remove domain '${domainName} with notes'?`, 'Yes', 'No')) !== 'Yes') return;
            withNotes = true
        } else if (confirm === domainName) {
            if ((await window.showInformationMessage(`Remove domain '${domainName}'?`, 'Yes', 'No')) !== 'Yes') return;
        }
        ext.notesDatabase.deleteDomain(_dn, withNotes);
        ext.domainProvider.refresh();
    }
    export async function cmdHdlDomainLabels(dn: DomainNode) {
        // const _dn = tools.splitDomaiNode(dn);
        // const notes = ext.domainDB.getDomainNotes(_dn);
        // if (notes.length >= 1) {
        //     window.showWarningMessage('the domain have notes.');
        //     return;
        // }
        // cmdHdlDomainEditLabels(dn);
        // const oldLabels = ext.domainDB.getDomainLabels(_dn)
        // const newLabels = await window.showInputBox({ value: oldLabels.join(',') });
        // if (newLabels === undefined) return;
        // ext.domainDB.updateLabels(_dn, newLabels.split(','))
        // ext.domainDB.refreshDomainNotes(_dn)
        // ext.domainProvider.refresh()
        // ext.notesPanelView.parseDomain(_dn).showNotesPlanView();
    }
    export async function cmdHdlDomainSearch(_dn: DomainNode) {
        window.showInformationMessage('soon');
    }
    export async function cmdHdlNoteOpenFolder(nId: string) {
        // await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getDirectory(nId)), true);
    }
    export async function cmdHdlNoteCategoryRename(nId: string) {
        // const oldCategory = ext.domainDB.noteDB.getMeta(nId).category;
        // const newCname = await window.showInputBox({ value: oldCategory });
        // if (newCname === undefined) return;
        // ext.domainDB.noteDB.updateCategory(nId, newCname);
        // ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlCategoryRename(oldCategory: string) {
        // const newCategory: string | undefined = await window.showInputBox({ value: oldCategory });
        // if (newCategory === undefined) return;
        // const domainNode = tools.splitDomaiNode(ext.globalState.domainNode!);
        // ext.domainDB
        //     .getDomainNotes(domainNode)
        //     .filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === oldCategory)
        //     .forEach((nId) => ext.domainDB.noteDB.updateCategory(nId, newCategory));
        // ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlCategoryRelabels(oldCategory: string) {
        // const domainNode = tools.splitDomaiNode(ext.globalState.domainNode!);
        // const allLabels = ext.domainDB
        //     .getDomainNotes(domainNode)
        //     .filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === oldCategory)
        //     .map((nId) => ext.domainDB.noteDB.getMeta(nId).labels);
        // const commonLabels = allLabels.slice(1).reduce((p, c) => tools.intersections(p, c), allLabels[0]);
        // const cl: string | undefined = await window.showInputBox({ value: commonLabels.join(',') });
        // if (cl === undefined) return;
    }
    export async function cmdHdlNoteDocShow(nId: string) {
        // const readmeFile = ext.domainDB.noteDB.selectDocReadmeFile(tools.splitDomaiNode(ext.globalState.domainNode), nId);
        // // Uri.file(ext.domainDB.noteDB.getDocIndexFile(nId, 'README.md')
        // if (basename(readmeFile).split('.')[1] === 'md') {
        //     const uri = Uri.file(readmeFile);
        //     await commands.executeCommand('markdown.showPreviewToSide', uri);
        // } else {
        //     noteDocHtmlPanel(readmeFile);
        // }
    }
    export async function cmdHdlNoteFilesOpen(nId: string) {
        ext.globalState.nId = nId;
        ext.filesProvider.refresh();
        await ext.setContext(ctxFilesExplorer, true);
    }
    export async function cmdHdlFilesClose() {
        await ext.setContext(ctxFilesExplorer, false);
    }
    export async function cmdHdlFilesEditOpen() {
        // await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getFilesPath(ext.globalState.nId)), true);
    }
    export async function cmdHdlFilesRefresh() {
        ext.filesProvider.refresh();
    }
    export async function cmdHdlFilesOpenTerminal() {
        // const nId = ext.globalState.nId;
        // const dpath = tools.splitDomaiNode(ext.globalState.domainNode!);
        // const filePath = ext.domainDB.noteDB.getFilesPath(nId);
        // const fileTerminal = window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
        // fileTerminal.show(true);
    }
    export async function cmdHdlDomainRefresh() {
        ext.notesDatabase = new NoteBookDatabase(ext.masterPath);
        ext.notesDatabase.refresh();
        window.showInformationMessage('refreshDomain complete.');
        ext.domainProvider.refresh();
    }
    // export async function cmdHdlNoteEditDocFull(nId: string) {
    //     await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getDocPath(nId)), true);
    // }
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
    // export async function cmdHdShortcutsLast() {
    //     const picks = ext.domainDB.getShortcutsList('last');
    //     const pick = await window.showQuickPick(picks);
    //     if (!pick) return;
    //     await cmdHdlDomainPin(pick);
    // }
    export async function cmdHdlNoteRemove(category: string, nId: string) {
        const domainNode = tools.splitDomaiNode(ext.globalState.domainNode);
        const selection = await window.showInformationMessage(`delete note ${nId}?`, 'Yes', 'No');
        if (selection !== 'Yes') return;
        // ext.domainDB.removeFromCache(nId);
        ext.notesDatabase.removeNote(domainNode, category, nId);
        // ext.domainDB.refreshDomainNodes(dn, true);
        // window.showInformationMessage(`note ${nId} deleted.`);
        // ext.domainProvider.refresh();
        // ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteColToActiveTermianl(nId: string, cIdx: string) {
        // if (window.activeTerminal) {
        //     const colContent = ext.domainDB.noteDB.getNoteContents(nId)[Number(cIdx)];
        //     window.activeTerminal.sendText(colContent);
        // }
    }
    export async function cmdHdlNoteColToActiveTermianlWithArgs(nId: string, cIdx: string) {
        // if (window.activeTerminal) {
        //     const colContent = ext.domainDB.noteDB.getNoteContents(nId)[Number(cIdx)];
        //     window.activeTerminal.sendText(colContent);
        // }
    }
    // export async function cmdHdlCategoryMoveToOtherDomain(category: string) {
    //     // const oldDomainNode = ext.globalState.dn!
    //     // const newDomainNode: string | undefined = await window.showInputBox({ value: oldDomainNode });
    //     // if (newDomainNode === undefined || newDomainNode === oldDomainNode) return;
    //     // // const newDomainNodeArray = tools.splitDomaiNode(newDomainNode);
    //     // ext.domainDB
    //     //     .selectNotes(tools.splitDomaiNode(ext.globalState.dn!))
    //     //     .filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === category)
    //     //     .forEach((nId) => {
    //     //         ext.domainDB.updateNoteLabelsDomainByLabels(nId, tools.splitDomaiNode(oldDomainNode), tools.splitDomaiNode(newDomainNode), false);
    //     //         ext.domainDB.noteDB.removeNotes(tools.splitDomaiNode(ext.globalState.dn!), nId);
    //     //         ext.domainDB.appendNote(tools.splitDomaiNode(newDomainNode), nId);
    //     //     });
    //     // ext.notesPanelView.parseDomain().showNotesPlanView();
    //     // ext.domainProvider.refresh();
    // }
    // export function resetDomain(orgDpath: string[], newDpath: string[]) {
    //     // ext.domainDB.updateNotesOfDomain(orgDpath, newDpath, true);
    //     // const notes = ext.domainDB.selectAllNotes(orgDpath);
    //     // ext.domainDB.deleteDomain(orgDpath);
    //     // ext.domainDB.cacheValidNotes(...notes);
    //     ext.notesPanelView.parseDomain(newDpath).showNotesPlanView();
    // }
    export async function cmdHdlDomainEditLabels(DomainData: string) {
        // const labels = ext.domainDB.getDomainLabels(tools.splitDomaiNode(DomainData));
        // const ib = await window.showInputBox({ value: labels.join(',') });
        // if (ib === undefined) return;
        // const newLabels = Array.from(new Set(ib.split(',')));
        // ext.domainDB.updateLabels(tools.splitDomaiNode(DomainData), newLabels);
        // ext.domainDB.refresh();
        // ext.domainProvider.refresh();
        // ext.notesPanelView.parseDomain().showNotesPlanView();
    }

    export async function cmdHdlNoteEditLabels({ nId }: { nId: string }) {
        // const oldLabels = ext.domainDB.noteDB.getMeta(nId).labels;
        // const ib = await window.showInputBox({ value: oldLabels.join(',') });
        // if (ib === undefined) return;
        // const newLabels = Array.from(new Set(ib.split(','))).map((l) => l.trim());
        // // if (newLabels.includes('@Trash')) {
        // //     const dn = tools.splitDomaiNode(ext.globalState.domainNode!)
        // //     if (ext.globalState.domainNode[0] !== '@Trash') {
        // //         ext.domainDB.appendNote(['@Trash'].concat(dn), nId)
        // //     } else {
        // //         ext.domainDB.appendNote(dn, nId)
        // //     }
        // // }
        // ext.domainDB.noteDB.updatelabels(nId, newLabels);
        // ext.domainDB.noteDB.removeCacheByLabels(nId, oldLabels);
        // ext.domainDB.noteDB.cache(nId, true);
        // ext.domainDB.refresh();
        // ext.domainProvider.refresh();
        // ext.notesPanelView.parseDomain().showNotesPlanView();
    }
}
