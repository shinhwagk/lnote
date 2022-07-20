import { commands, Uri, window, workspace } from 'vscode'

import { ext } from './extensionVariables'
import { DomainNode } from './explorer/domainExplorer'
import { ctxFilesExplorer, section } from './constants'
import { NoteBookDatabase } from './database'
import { tools } from './helper'
import { existsSync, statSync } from 'fs-extra'

export namespace ExtCmds {
    export async function cmdHdlChooseLocation () {
      // { title: 'choose vscode-note data location.' }
      const dl = await window.showInputBox()
      if (dl === undefined || dl === '') return
      if (!existsSync(dl)) {
        workspace.getConfiguration(section).update('notespath', dl, 1)
      } else {
        if (!statSync(dl).isDirectory()) {
          window.showInformationMessage('Make sure the directory already exists.')
        } else {
          workspace.getConfiguration(section).update('notespath', dl, 1)
        }
      }
    }
    export async function cmdHdlNoteEditNoteContents (nId: string) {
      const domainNode: string[] = tools.splitDomaiNode(ext.globalState.domainNode!)
      const noteEditFile = ext.notebookDatabase.createEditNoteEnv(domainNode[0], nId)
      const v = Uri.file(noteEditFile)
      ext.editNotes.set(nId, domainNode)
      commands.executeCommand('editExplorer.openFileResource', v)
    }
    export async function cmdHdlDomainNotesCreate (dn: DomainNode) {
      ext.globalState.domainNode = dn
      ext.globalState.nbName = tools.splitDomaiNode(dn)[0]
      // ext.domainDB.createDomain(tools.splitDomaiNode(dn))
      // ext.domainDB.createNotes(tools.splitDomaiNode(dn));
      // ext.domainProvider.refresh(dn);
      await cmdHdlDomainCategoryAdd(true)
      // await cmdHdlDomainPin(dn);
      ext.domainProvider.refresh(dn)
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
    export async function cmdHdlCategoryMoveToOtherDomain () {

    }
    export async function cmdHdlDomainCreate (dn?: DomainNode) {
      const _dn: string[] = dn ? tools.splitDomaiNode(dn) : []
      const name: string | undefined = await window.showInputBox()
      if (!name) return
      if (name.includes('/')) {
        window.showErrorMessage('domain name cannot contain "/".')
      }
      if (dn === undefined) {
        ext.notebookDatabase.createNotebook(name)
      }
      ext.notebookDatabase.createDomain(_dn.concat(name))
      ext.domainProvider.refresh(dn)
      !dn || ext.domainTreeView.reveal(dn, { expand: true })
    }
    export async function cmdHdlDomainPin (dn: DomainNode) {
      ext.globalState.domainNode = dn
      ext.globalState.nbName = tools.splitDomaiNode(dn)[0]
      ext.notebookDatabase.cacheNBNotes(ext.globalState.nbName)
      // ext.domainDB.refresh(tools.splitDomaiNode(dn), true);
      ext.notesPanelView.parseDomain(tools.splitDomaiNode(dn)).showNotesPlanView()
      await ext.setContext(ctxFilesExplorer, false)
    }
    // export async function cmdHdlNoteEditRemove() {
    //     const sqp = await window.showQuickPick(['Yes', 'No']);
    //     if (!sqp || sqp === 'No') return;
    //     ext.domainDB.removeNotes(tools.splitDomaiNode(ext.activeNote.dn!), ext.activeNote.nId!);
    //     // ext.dbFS.removeNotes(ext.activeNote.dpath, ext.activeNote.id!);
    //     ext.notesPanelView.parseDomain().showNotesPlanView();
    // }
    export async function cmdHdlDomainCategoryAdd (useDefault: boolean) {
      let cname: undefined | string = 'default'
      if (!useDefault) {
        cname = await window.showInputBox({ value: 'default' })
        if (!cname) return
      }
      ext.notebookDatabase.createCategory(tools.splitDomaiNode(ext.globalState.domainNode), cname)
      await cmdHdlNoteAdd(cname)
    }
    export async function cmdHdlNBDomainCategoryRemove (category: string) {
      const domainNode: string[] = tools.splitDomaiNode(ext.globalState.domainNode!)
      const confirm = await window.showInputBox({
        title: 'Are you absolutely sure?',
        placeHolder: `Please type '${category}' or '${category} with notes' to confirm.`
      })
      if (confirm === `${category} with notes`) {
        if ((await window.showInformationMessage(`Remove category '${category} with notes'?`, 'Yes', 'No')) !== 'Yes') return
        ext.notebookDatabase.removeCategory(domainNode, category, true)
      } else if (confirm === category) {
        if ((await window.showInformationMessage(`Remove category '${category}'?`, 'Yes', 'No')) !== 'Yes') return
        ext.notebookDatabase.removeCategory(domainNode, category, false)
      } else {
        window.showInformationMessage(`Input is not '${category}'.`)
        return
      }
      ext.notebookDatabase.refresh(domainNode[0])
      // ext.notebookDatabase.refresh(domainNode.slice(0, 1));
      ext.domainProvider.refresh(ext.globalState.domainNode)
      ext.notesPanelView.parseDomain(domainNode).showNotesPlanView()
    }
    export async function cmdHdlNoteAdd (category: string) {
      const domainNode: string[] = tools.splitDomaiNode(ext.globalState.domainNode!)
      const nId = ext.notebookDatabase.addNote(domainNode, category)
      cmdHdlNoteEditNoteContents(nId)
      ext.notebookDatabase.refresh(domainNode[0])
      ext.domainProvider.refresh(ext.globalState.domainNode)
      ext.notesPanelView.parseDomain(domainNode).showNotesPlanView()
    }
    export async function cmdHdlNoteFilesCreate (nId: string) {
      ext.notebookDatabase.noteFilesCreate(ext.globalState.nbName, nId)
      ext.notesPanelView.parseDomain().showNotesPlanView()
      await cmdHdlNoteFilesOpen(nId)
    }
    export async function cmdHdlNoteEditFilesClose () {
      await ext.setContext(ctxFilesExplorer, true)
    }
    export async function cmdHdlNBNoteDocCreate (nId: string) {
      const nbName: string = tools.splitDomaiNode(ext.globalState.domainNode!)[0]
      ext.notebookDatabase.noteDocCreate(nbName, nId)
      await commands.executeCommand(
        'editExplorer.openFileResource',
        Uri.file(ext.notebookDatabase.getDocMainFile(nbName, nId))
      )
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
    export async function cmdHdlDomainRemove (dn: DomainNode) {
      const _dn = tools.splitDomaiNode(dn)
      const domainName = _dn[_dn.length - 1]
      const confirm = await window.showInputBox({
        title: 'Are you absolutely sure?',
        placeHolder: `Please type '${domainName}' or '${domainName} with notes' to confirm.`
      })
      let withNotes = false
      if (confirm !== domainName) {
        window.showInformationMessage(`Input is not '${domainName}'.`)
        return
      } else if (confirm === `${domainName} with notes`) {
        if ((await window.showInformationMessage(`Remove domain '${domainName} with notes'?`, 'Yes', 'No')) !== 'Yes') return
        withNotes = true
      } else if (confirm === domainName) {
        if ((await window.showInformationMessage(`Remove domain '${domainName}'?`, 'Yes', 'No')) !== 'Yes') return
      }
      ext.notebookDatabase.deleteDomain(_dn, withNotes)
      ext.domainProvider.refresh()
    }
    export async function cmdHdlDomainSearch (_dn: DomainNode) {
      window.showInformationMessage('soon')
    }
    export async function cmdHdlNoteOpenFolder (_nId: string) {
      // await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getDirectory(nId)), true);
    }
    export async function cmdHdlNoteCategoryRename (_nId: string) {
      // const oldCategory = ext.domainDB.noteDB.getMeta(nId).category;
      // const newCname = await window.showInputBox({ value: oldCategory });
      // if (newCname === undefined) return;
      // ext.domainDB.noteDB.updateCategory(nId, newCname);
      // ext.notesPanelView.parseDomain().showNotesPlanView();
    }
    export async function cmdHdlNBDomainCategoryRename (oldCategoryName: string) {
      const newCategoryName: string | undefined = await window.showInputBox({ value: oldCategoryName })
      if (newCategoryName === undefined) return
      const domainNode = tools.splitDomaiNode(ext.globalState.domainNode!)
      ext.notebookDatabase.renameCategory(domainNode, oldCategoryName, newCategoryName)
      ext.notesPanelView.parseDomain(domainNode).showNotesPlanView()
    }
    export async function cmdHdlNotebookNoteDocShow (nId: string) {
      const nbName = tools.splitDomaiNode(ext.globalState.domainNode)[0]
      const docMainfFile = ext.notebookDatabase.getDocMainFile(nbName, nId)
      // // Uri.file(ext.domainDB.noteDB.getDocIndexFile(nId, 'README.md')
      // if (basename(readmeFile).split('.')[1] === 'md') {
      const uri = Uri.file(docMainfFile)
      await commands.executeCommand('markdown.showPreviewToSide', uri)
      // } else {
      //     noteDocHtmlPanel(readmeFile);
      // }
    }
    export async function cmdHdlNoteFilesOpen (nId: string) {
      ext.globalState.nId = nId
      ext.filesProvider.refresh()
      await ext.setContext(ctxFilesExplorer, true)
    }
    export async function cmdHdlFilesClose () {
      await ext.setContext(ctxFilesExplorer, false)
    }
    export async function cmdHdlFilesEditOpen () {
      await commands.executeCommand('vscode.openFolder', Uri.file(ext.notebookDatabase.getFilesPath(ext.globalState.nbName, ext.globalState.nId)), true)
    }
    export async function cmdHdlFilesRefresh () {
      ext.filesProvider.refresh()
    }
    export async function cmdHdlFilesOpenTerminal () {
      // const nId = ext.globalState.nId;
      // const dpath = tools.splitDomaiNode(ext.globalState.domainNode!);
      // const filePath = ext.domainDB.noteDB.getFilesPath(nId);
      // const fileTerminal = window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
      // fileTerminal.show(true);
    }
    export async function cmdHdlDomainRefresh () {
      ext.notebookDatabase = new NoteBookDatabase(ext.notebookPath)
      ext.notebookDatabase.refresh()
      window.showInformationMessage('refreshDomain complete.')
      ext.domainProvider.refresh()
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
    export async function cmdHdlNBDomainCategoryNoteRemove (category: string, nId: string) {
      const dn = tools.splitDomaiNode(ext.globalState.domainNode)
      const selection = await window.showInformationMessage(`delete note ${nId}?`, 'Yes', 'No')
      if (selection !== 'Yes') return
      // ext.domainDB.removeFromCache(nId);
      ext.notebookDatabase.removeNote(dn, category, nId)
      // ext.domainDB.refreshDomainNodes(dn, true);
      // window.showInformationMessage(`note ${nId} deleted.`);
      ext.domainProvider.refresh(dn[0])
      ext.notesPanelView.parseDomain().showNotesPlanView()
    }
    export async function cmdHdlNoteColToActiveTermianl (_nId: string, _cIdx: string) {
      // if (window.activeTerminal) {
      //     const colContent = ext.domainDB.noteDB.getNoteContents(nId)[Number(cIdx)];
      //     window.activeTerminal.sendText(colContent);
      // }
    }
    export async function cmdHdlNoteColToActiveTermianlWithArgs (_nId: string, _cIdx: string) {
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

}
