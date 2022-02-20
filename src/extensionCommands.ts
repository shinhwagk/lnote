import { basename } from 'path';

import { commands, Uri, window } from 'vscode';

import { ext } from './extensionVariables';
import { noteDocHtmlPanel } from './panel/noteDocHtmlPanel';
import { DomainNode, Tools } from './explorer/domainExplorer';
import { ctxFilesExplorer } from './constants';
import { DomainDatabase } from './database';
import { tools, vfs } from './helper';

export namespace ExtCmds {
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
        ext.globalState.dn = dn;
        // ext.domainDB.createDomain(Tools.splitDomaiNode(dn))
        // ext.domainDB.createNotes(Tools.splitDomaiNode(dn));
        // ext.domainProvider.refresh(dn);
        await cmdHdlCategoryAdd(true);
        // await cmdHdlDomainPin(dn);
        ext.domainProvider.refresh(dn);
        ext.notesPanelView.parseDomain(Tools.splitDomaiNode(dn)).showNotesPlanView();
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
        ext.domainDB.createDomain(_dn, name, true);
        ext.domainProvider.refresh(dn);
        !dn || ext.domainTreeView.reveal(dn, { expand: true });
    }
    export async function cmdHdlDomainPin(dn: DomainNode) {
        ext.globalState.dn = dn;
        ext.notesPanelView.parseDomain(Tools.splitDomaiNode(dn)).showNotesPlanView();
        ext.domainDB.appendLastDomainToShortcuts(dn);
        await ext.setContext(ctxFilesExplorer, false);
    }
    export async function cmdHdlDomainPinLabels(dn: DomainNode) {
        ext.globalState.dn = dn;
        ext.notesPanelView.parseDomain(Tools.splitDomaiNode(dn)).showNotesPlanView();
        ext.domainDB.appendLastDomainToShortcuts(dn);
        await ext.setContext(ctxFilesExplorer, false);
    }
    export async function cmdHdlNoteColRemove(nId: string, cIdx: string) {
        //cn : column number
        if (ext.domainDB.noteDB.getContentFiles(nId).length === 1) {
            window.showInformationMessage("don't remove short document if only one.");
            return;
        }
        ext.domainDB.noteDB.removeCol(nId, Number(cIdx));
        cmdHdlDomainPin(ext.globalState.dn);
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
        await cmdHdlNoteAdd(cname);
    }
    export async function cmdHdlNoteAdd(category: string, editFirst: boolean = true) {
        const nId: string = ext.domainDB.appendNewDomain(Tools.splitDomaiNode(ext.globalState.dn!), category);
        vfs.writeFileSync(ext.domainDB.noteDB.getContentFile(nId, '1'));
        if (editFirst) {
            await commands.executeCommand(
                'editExplorer.openFileResource',
                Uri.file(ext.domainDB.noteDB.getContentFile(nId, '1'))
            );
        }
        ext.domainProvider.refresh(ext.globalState.dn);
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteEditFilesCreate(nId: string) {
        ext.domainDB.noteDB.createNoteFiles(nId);
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
    export async function cmdHdlDomainMove(dn: DomainNode) {
        const orgDpath = Tools.splitDomaiNode(dn);
        const newDpathString: string | undefined = await window.showInputBox({ value: orgDpath.join('/') });
        if (!newDpathString || orgDpath.join('/') === newDpathString) return;
        const newDpath = Tools.splitDomaiNode(newDpathString);
        resetDomain(orgDpath, newDpath);
        for (let i = 0; i <= orgDpath.length; i++) {
            if (orgDpath[i] !== newDpath[i]) {
                const dpath = newDpath.slice(0, i);
                await ext.domainProvider.refresh(dpath.join('/'));
                await ext.domainTreeView.reveal(newDpath.join('/'));
                break;
            }
        }
        // ext.globalState.dpath = newDpath;
    }
    export async function cmdHdlDomainRename(dn: DomainNode) {
        const orgDpath = Tools.splitDomaiNode(dn);
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
        const domainNode = Tools.splitDomaiNode(ext.globalState.dn!);
        ext.domainDB
            .selectNotes(domainNode)
            .filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === oldCategory)
            .forEach((nId) => ext.domainDB.noteDB.updateCategory(nId, newCategory));
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlCategoryRelabels(oldCategory: string) {
        const domainNode = Tools.splitDomaiNode(ext.globalState.dn!);
        const allLabels = ext.domainDB
            .selectNotes(domainNode)
            .filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === oldCategory)
            .map((nId) => ext.domainDB.noteDB.getMeta(nId).labels);
        const commonLabels = allLabels.slice(1).reduce((p, c) => tools.intersections(p, c), allLabels[0]);
        const cl: string | undefined = await window.showInputBox({ value: commonLabels.join(',') });
        if (cl === undefined) return;
    }
    export async function cmdHdlNoteDocShow(nId: string) {
        const readmeFile = ext.domainDB.noteDB.selectDocIndexFile(nId);
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
        const dpath = Tools.splitDomaiNode(ext.globalState.dn!);
        const filePath = ext.domainDB.noteDB.getFilesPath(nId);
        const fileTerminal = window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
        fileTerminal.show(true);
    }
    export async function cmdHdlDomainRefresh() {
        ext.domainDB = new DomainDatabase(ext.masterPath);
        ext.domainDB.refresh();
        window.showInformationMessage('refreshDomain success.');
        ext.domainProvider.refresh();
    }
    export async function cmdHdlNoteEditDocFull(nId: string) {
        await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getDocPath(nId)), true);
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
    export async function cmdHdlNoteEditRemove(nId: string) {
        const dpath = Tools.splitDomaiNode(ext.globalState.dn);
        ext.domainDB.updateNoteLabelsDomainByLabels(nId, dpath, ['@Trash'].concat(dpath), false);
        cmdHdlDomainRefresh();
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNoteColToActiveTermianl(nId: string, cIdx: string) {
        if (window.activeTerminal) {
            const colContent = ext.domainDB.noteDB.selectContents(nId)[Number(cIdx)];
            window.activeTerminal.sendText(colContent);
        }
    }
    export async function cmdHdlNoteColToActiveTermianlWithArgs(nId: string, cIdx: string) {
        if (window.activeTerminal) {
            const colContent = ext.domainDB.noteDB.selectContents(nId)[Number(cIdx)];
            window.activeTerminal.sendText(colContent);
        }
    }
    export async function cmdHdlCategoryMoveToOtherDomain(category: string) {
        // const oldDomainNode = ext.globalState.dn!
        // const newDomainNode: string | undefined = await window.showInputBox({ value: oldDomainNode });
        // if (newDomainNode === undefined || newDomainNode === oldDomainNode) return;
        // // const newDomainNodeArray = Tools.splitDomaiNode(newDomainNode);
        // ext.domainDB
        //     .selectNotes(Tools.splitDomaiNode(ext.globalState.dn!))
        //     .filter((nId) => ext.domainDB.noteDB.getMeta(nId).category === category)
        //     .forEach((nId) => {
        //         ext.domainDB.updateNoteLabelsDomainByLabels(nId, Tools.splitDomaiNode(oldDomainNode), Tools.splitDomaiNode(newDomainNode), false);
        //         ext.domainDB.noteDB.removeNotes(Tools.splitDomaiNode(ext.globalState.dn!), nId);
        //         ext.domainDB.appendNote(Tools.splitDomaiNode(newDomainNode), nId);
        //     });
        // ext.notesPanelView.parseDomain().showNotesPlanView();
        // ext.domainProvider.refresh();
    }
    export function resetDomain(orgDpath: string[], newDpath: string[]) {
        ext.domainDB.updateNotesOfDomain(orgDpath, newDpath, true);
        const notes = ext.domainDB.selectAllNotes(orgDpath);
        // ext.domainDB.deleteDomain(orgDpath);
        // ext.domainDB.cacheValidNotes(...notes);
        ext.notesPanelView.parseDomain(newDpath).showNotesPlanView();
    }
    export async function cmdHdlDomainEditLabels(DomainData: string) {
        const labels = ext.domainDB.getDomainLabels(DomainData.split('/'));
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
        ext.domainDB.noteDB.updatelabels(nId, newLabels);
        ext.domainDB.noteDB.removeCacheByLabels(nId, oldLabels);
        ext.domainDB.noteDB.appendToCache(nId, Array.from(new Set(newLabels)));
        ext.domainDB.refresh();
        ext.domainProvider.refresh();
        ext.notesPanelView.parseDomain().showNotesPlanView();
    }
}
