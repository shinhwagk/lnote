import { basename } from 'path';

import { commands, Uri, window, workspace } from 'vscode';

import { ext } from './extensionVariables';
import { noteDocHtmlPanel } from './panel/noteDocHtmlPanel';
import { DomainNode, Tools } from './explorer/domainExplorer';
import { ctxFilesExplorer, section } from './constants';
import { DomainDatabase } from './database';
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
    export async function cmdHdlNoteEditColAdd(nId: string) {
        const cn = ext.domainDB.noteDB.addCol(nId);
        await commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.domainDB.noteDB.getContentFile(nId, cn)));
        // ext.editProvider.refresh();
    }
    // export async function cmdHdlNoteEditCol(id: string, cn: string) {
    //     const rst = await window.showQuickPick(['delete', '------', 'add']);
    //     if (!rst) return;
    //     ext.activeNote.nId = id;
    //     if (rst === 'add') {
    //         await cmdHdlNoteEditColAdd(id);
    //     } else if (rst === 'delete') {
    //         await cmdHdlNoteColRemove(id, cn);
    //     } else {
    //     }
    //     ext.notesPanelView.parseDomain().showNotesPlanView();
    // }
    export async function cmdHdlNoteEditColContent(nId: string, n: string) {
        const v = Uri.file(ext.domainDB.noteDB.getContentFile(nId, n));
        commands.executeCommand('editExplorer.openFileResource', v);
    }
    export async function cmdHdlNotesCreate(dn: DomainNode) {
        ext.globalState.domainNode = dn;
        // ext.domainDB.createDomain(Tools.splitDomaiNode(dn))
        // ext.domainDB.createNotes(Tools.splitDomaiNode(dn));
        // ext.domainProvider.refresh(dn);
        const domainNode = Tools.splitDomaiNode(dn);
        const lables = domainNode;
        ext.domainDB.updateLabels(domainNode, lables);
        await cmdHdlCategoryAdd(true);
        // await cmdHdlDomainPin(dn);
        ext.domainProvider.refresh(dn);
        // ext.notesPanelView.parseDomain(Tools.splitDomaiNode(domainNode)).showNotesPlanView();
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
        const _dn: string[] = dn ? Tools.splitDomaiNode(dn) : [];
        const name: string | undefined = await window.showInputBox();
        if (!name) return;
        ext.domainDB.createDomain(_dn.concat(name));
        ext.domainProvider.refresh(dn);
        !dn || ext.domainTreeView.reveal(dn, { expand: true });
    }
    export async function cmdHdlDomainPin(dn: DomainNode) {
        ext.globalState.domainNode = dn;
        ext.domainDB.refreshDomainNodes(Tools.splitDomaiNode(dn), true);
        ext.notesPanelView.parseDomain(Tools.splitDomaiNode(dn)).showNotesPlanView();
        // ext.domainDB.appendLastDomainToShortcuts(dn);
        await ext.setContext(ctxFilesExplorer, false);
    }
    export async function cmdHdlDomainPinLabels(dn: DomainNode) {
        ext.globalState.domainNode = dn;
        ext.notesPanelView.parseDomain(Tools.splitDomaiNode(dn)).showNotesPlanView();
        // ext.domainDB.appendLastDomainToShortcuts(dn);
        await ext.setContext(ctxFilesExplorer, false);
    }
    export async function cmdHdlNoteColRemove(nId: string, cIdx: string) {
        //cn : column number
        if (ext.domainDB.noteDB.getContentFiles(nId).length === 1) {
            window.showInformationMessage("don't remove short document if only one.");
            return;
        }
        ext.domainDB.noteDB.removeCol(nId, Number(cIdx));
        cmdHdlDomainPin(ext.globalState.domainNode);
    }
    // export async function cmdHdlNoteEditRemove() {
    //     const sqp = await window.showQuickPick(['Yes', 'No']);
    //     if (!sqp || sqp === 'No') return;
    //     ext.domainDB.removeNotes(Tools.splitDomaiNode(ext.activeNote.dn!), ext.activeNote.nId!);
    //     // ext.dbFS.removeNotes(ext.activeNote.dpath, ext.activeNote.id!);
    //     ext.notesPanelView.parseDomain().showNotesPlanView();
    // }
    export async function cmdHdlCategoryAdd(useDefault: boolean) {
        let cname: undefined | string = 'default';
        if (!useDefault) {
            cname = await window.showInputBox({ value: 'default' });
            if (!cname) return;
        }
        await cmdHdlNoteCreate(cname);
    }
    export async function cmdHdlCategoryRemove(category: string) {
        const confirm = await window.showInputBox({
            title: 'Are you absolutely sure?',
            placeHolder: `Please type ${category} to confirm.`,
        });
        if (confirm !== category) {
            window.showInformationMessage(`Input is not '${category}'.`);
            return;
        } else {
            if ((await window.showInformationMessage(`Remove category '${category}'?`, 'Yes', 'No')) !== 'Yes') return;
        }
        const domainNode: string[] = Tools.splitDomaiNode(ext.globalState.domainNode!);
        const nIds = ext.domainDB.getDomainNotes(domainNode);
        nIds.filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === category).forEach((nId) => {
            ext.domainDB.noteDB.removeFromCache(nId);
            ext.domainDB.noteDB.remove(nId);
        });
        ext.domainDB.refreshDomainNodes(domainNode, true);
        ext.domainProvider.refresh();
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteCreate(category: string, editFirst: boolean = true) {
        const domainNode: string[] = Tools.splitDomaiNode(ext.globalState.domainNode!);
        const nId: string = ext.domainDB.noteDB.create(domainNode, category);
        // ext.domainDB.noteDB.cache(nId)
        ext.domainDB.refreshDomainNodes(domainNode, true);
        ext.domainProvider.refresh(ext.globalState.domainNode);
        ext.notesPanelView.parseDomain(domainNode).showNotesPlanView();
        if (editFirst) {
            await commands.executeCommand(
                'editExplorer.openFileResource',
                Uri.file(ext.domainDB.noteDB.getContentFile(nId, '1'))
            );
        }
    }
    export async function cmdHdlNoteEditFilesCreate(nId: string) {
        ext.domainDB.noteDB.createFiles(nId);
        ext.notesPanelView.parseDomain().showNotesPlanView();
        await cmdHdlNoteFilesOpen(nId);
    }
    export async function cmdHdlNoteEditFilesClose() {
        await ext.setContext(ctxFilesExplorer, true);
    }
    export async function cmdHdlNoteEditDocCreate(nId: string) {
        ext.domainDB.noteDB.createDoc(nId);
        await commands.executeCommand(
            'editExplorer.openFileResource',
            Uri.file(ext.domainDB.noteDB.getDocIndexFile(nId, 'README.md'))
        );
    }
    // export async function cmdHdlDomainMove(dn: DomainNode) {
    //     // const orgDpath = Tools.splitDomaiNode(dn);
    //     // const newDpathString: string | undefined = await window.showInputBox({ value: orgDpath.join('/') });
    //     // if (!newDpathString || orgDpath.join('/') === newDpathString) return;
    //     // const newDpath = Tools.splitDomaiNode(newDpathString);
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
    //     const _dn = Tools.splitDomaiNode(dn);
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
        const _dn = Tools.splitDomaiNode(dn);
        const lastDomainName = _dn[_dn.length - 1];
        const confirm = await window.showInputBox({
            title: 'Are you absolutely sure?',
            placeHolder: `Please type ${lastDomainName} to confirm.`,
        });
        if (confirm !== lastDomainName) {
            window.showInformationMessage(`Input is not '${lastDomainName}'.`);
            return;
        } else {
            if ((await window.showInformationMessage(`Remove domain '${lastDomainName}'?`, 'Yes', 'No')) !== 'Yes') return;
        }
        ext.domainDB.deleteDomain(_dn);
        ext.domainProvider.refresh();
    }
    export async function cmdHdlDomainLabels(dn: DomainNode) {
        const _dn = Tools.splitDomaiNode(dn);
        const notes = ext.domainDB.getDomainNotes(_dn);
        if (notes.length >= 1) {
            window.showWarningMessage('the domain have notes.');
            return;
        }
        cmdHdlDomainEditLabels(dn);
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
        await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getDirectory(nId)), true);
    }
    export async function cmdHdlNoteEditCategoryRename(nId: string) {
        const oldCategory = ext.domainDB.noteDB.getMeta(nId).category;
        const newCname = await window.showInputBox({ value: oldCategory });
        if (newCname === undefined) return;
        ext.domainDB.noteDB.updateCategory(nId, newCname);
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlCategoryRename(oldCategory: string) {
        const newCategory: string | undefined = await window.showInputBox({ value: oldCategory });
        if (newCategory === undefined) return;
        const domainNode = Tools.splitDomaiNode(ext.globalState.domainNode!);
        ext.domainDB
            .getDomainNotes(domainNode)
            .filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === oldCategory)
            .forEach((nId) => ext.domainDB.noteDB.updateCategory(nId, newCategory));
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlCategoryRelabels(oldCategory: string) {
        const domainNode = Tools.splitDomaiNode(ext.globalState.domainNode!);
        const allLabels = ext.domainDB
            .getDomainNotes(domainNode)
            .filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === oldCategory)
            .map((nId) => ext.domainDB.noteDB.getMeta(nId).labels);
        const commonLabels = allLabels.slice(1).reduce((p, c) => tools.intersections(p, c), allLabels[0]);
        const cl: string | undefined = await window.showInputBox({ value: commonLabels.join(',') });
        if (cl === undefined) return;
    }
    export async function cmdHdlNoteDocShow(nId: string) {
        const readmeFile = ext.domainDB.noteDB.selectDocReadmeFile(nId);
        // Uri.file(ext.domainDB.noteDB.getDocIndexFile(nId, 'README.md')
        if (basename(readmeFile).split('.')[1] === 'md') {
            const uri = Uri.file(readmeFile);
            await commands.executeCommand('markdown.showPreviewToSide', uri);
        } else {
            noteDocHtmlPanel(readmeFile);
        }
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
        await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getFilesPath(ext.globalState.nId)), true);
    }
    export async function cmdHdlFilesRefresh() {
        ext.filesProvider.refresh();
    }
    export async function cmdHdlFilesOpenTerminal() {
        const nId = ext.globalState.nId;
        const dpath = Tools.splitDomaiNode(ext.globalState.domainNode!);
        const filePath = ext.domainDB.noteDB.getFilesPath(nId);
        const fileTerminal = window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
        fileTerminal.show(true);
    }
    export async function cmdHdlDomainRefresh() {
        ext.domainDB = new DomainDatabase(ext.masterPath);
        ext.domainDB.refresh();
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
    export async function cmdHdlNoteRemove(nId: string) {
        const dn = Tools.splitDomaiNode(ext.globalState.domainNode);
        // if (ext.domainDB.noteDB.getContentFiles(nId).length >= 2) {
        //     window.showInformationMessage(
        //         `The number of short documents with note id '${nId}' must be less than 2, please edit note to delete cols.`
        //     );
        //     return;
        // } else {
        //     if (ext.domainDB.noteDB.getShortDocumentContent(nId, '1').trim().length >= 1) {
        //         window.showInformationMessage(`The content of the short document with note id '${nId}' must be empty.`);
        //         return;
        //     }
        //     if (ext.domainDB.noteDB.checkDocExist(nId) || ext.domainDB.noteDB.checkFilesExist(nId)) {
        //         window.showInformationMessage(`The doc or files of the short document with note id '${nId}' must be not exist.`);
        //         return;
        //     }
        // }
        const selection = await window.showInformationMessage(`delete note ${nId}?`, 'Yes', 'No');
        if (selection !== 'Yes') return;
        ext.domainDB.noteDB.removeFromCache(nId);
        ext.domainDB.noteDB.remove(nId);
        ext.domainDB.refreshDomainNodes(dn, true);
        window.showInformationMessage(`note ${nId} deleted.`);
        ext.domainProvider.refresh();
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteColToActiveTermianl(nId: string, cIdx: string) {
        if (window.activeTerminal) {
            const colContent = ext.domainDB.noteDB.getNoteContents(nId)[Number(cIdx)];
            window.activeTerminal.sendText(colContent);
        }
    }
    export async function cmdHdlNoteColToActiveTermianlWithArgs(nId: string, cIdx: string) {
        if (window.activeTerminal) {
            const colContent = ext.domainDB.noteDB.getNoteContents(nId)[Number(cIdx)];
            window.activeTerminal.sendText(colContent);
        }
    }
    // export async function cmdHdlCategoryMoveToOtherDomain(category: string) {
    //     // const oldDomainNode = ext.globalState.dn!
    //     // const newDomainNode: string | undefined = await window.showInputBox({ value: oldDomainNode });
    //     // if (newDomainNode === undefined || newDomainNode === oldDomainNode) return;
    //     // // const newDomainNodeArray = Tools.splitDomaiNode(newDomainNode);
    //     // ext.domainDB
    //     //     .selectNotes(Tools.splitDomaiNode(ext.globalState.dn!))
    //     //     .filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === category)
    //     //     .forEach((nId) => {
    //     //         ext.domainDB.updateNoteLabelsDomainByLabels(nId, Tools.splitDomaiNode(oldDomainNode), Tools.splitDomaiNode(newDomainNode), false);
    //     //         ext.domainDB.noteDB.removeNotes(Tools.splitDomaiNode(ext.globalState.dn!), nId);
    //     //         ext.domainDB.appendNote(Tools.splitDomaiNode(newDomainNode), nId);
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
        const labels = ext.domainDB.getDomainLabels(Tools.splitDomaiNode(DomainData));
        const ib = await window.showInputBox({ value: labels.join(',') });
        if (ib === undefined) return;
        const newLabels = Array.from(new Set(ib.split(',')));
        ext.domainDB.updateLabels(Tools.splitDomaiNode(DomainData), newLabels);
        ext.domainDB.refresh();
        ext.domainProvider.refresh();
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }

    export async function cmdHdlNoteEditLabels({ nId }: { nId: string }) {
        const oldLabels = ext.domainDB.noteDB.getMeta(nId).labels;
        const ib = await window.showInputBox({ value: oldLabels.join(',') });
        if (ib === undefined) return;
        const newLabels = Array.from(new Set(ib.split(','))).map((l) => l.trim());
        // if (newLabels.includes('@Trash')) {
        //     const dn = Tools.splitDomaiNode(ext.globalState.domainNode!)
        //     if (ext.globalState.domainNode[0] !== '@Trash') {
        //         ext.domainDB.appendNote(['@Trash'].concat(dn), nId)
        //     } else {
        //         ext.domainDB.appendNote(dn, nId)
        //     }
        // }
        ext.domainDB.noteDB.updatelabels(nId, newLabels);
        ext.domainDB.noteDB.removeCacheByLabels(nId, oldLabels);
        ext.domainDB.noteDB.cache(nId, true);
        ext.domainDB.refresh();
        ext.domainProvider.refresh();
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
}
