import { existsSync, statSync } from 'fs-extra';
import { commands, Uri, window, workspace } from 'vscode';

import { ctxFilesExplorer, section } from './constants';
import { DomainNode } from './explorer/domainExplorer';
import { ext } from './extensionVariables';
import { tools } from './helper';

export namespace ExtCmds {
  export async function cmdHdlChooseLocation() {
    // { title: 'choose lnote data location.' }
    const dl = await window.showInputBox();
    if (dl === undefined || dl === '') { return; };
    if (!existsSync(dl)) {
      workspace.getConfiguration(section).update('notespath', dl, 1);
    } else {
      if (!statSync(dl).isDirectory()) {
        window.showInformationMessage('Make sure the directory already exists.');
      } else {
        workspace.getConfiguration(section).update('notespath', dl, 1);
      }
    }
  }
  export async function cmdHdlNoteEdit(nId: string) {
    ext.gs.nb.createEditNoteEnv(nId);
    commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.gs.nb.editFile));
  }
  // export async function cmdHdlNotebookNoteContentsAdd(nId: string, sdIdx: number) {
  //   const contents = ext.notebookDatabase.getNBNotes(ext.globalState.nbName)[nId].contents;
  //   contents.splice(sdIdx + 1, 0, "");
  //   ext.notebookDatabase.updateNoteContents(ext.globalState.nbName, nId, contents);
  //   await cmdHdlNotebookNoteContentsEdit(nId, sdIdx + 1);
  // }
  // export async function cmdHdlNotebookNoteContentsRemove(nId: string, sdIdx: number) {
  //   const contents = ext.notebookDatabase.getNBNotes(ext.globalState.nbName)[nId].contents;
  //   contents.splice(sdIdx, 1);
  //   ext.notebookDatabase.updateNote(ext.globalState.nbName, nId, contents);
  //   ext.notebookDatabase.refresh(ext.globalState.nbName);
  //   ext.notesPanelView.parseDomain(ext.globalState.domainNodeFormat).showNotesPlanView();
  // }

  export async function cmdHdlDomainNotesCreate(dn: DomainNode) {
    ext.updateGS(dn);
    const labelsOfDomain = await window.showInputBox({ value: ext.gs.domainNodeFormat.join(', ') });
    if (labelsOfDomain === undefined) { return; };
    const _l = labelsOfDomain.split(',').map(l => l.trim());
    ext.gs.nb.craeteNotes(ext.gs.domainNodeFormat, _l);
    ext.vnNotebookSet.refresh(ext.gs.nbName);
    ext.domainProvider.refresh(dn);
    await cmdHdlDomainPin(dn);
  }
  export async function cmdHdlDomainCreate(dn?: DomainNode) {
    const _dn: string[] = dn ? tools.splitDomaiNode(dn) : [];
    const name: string | undefined = await window.showInputBox();
    if (!name) { return; };
    if (name.includes('/')) {
      window.showErrorMessage('domain name cannot contain "/".');
    }
    if (dn === undefined) {
      ext.vnNotebookSet.createNB(name);
    }
    ext.updateGS(dn || name);
    ext.gs.nb.addDomain(_dn.concat(name));
    ext.domainProvider.refresh(dn);
    !dn || ext.domainTreeView.reveal(dn, { expand: true });
  }
  export async function cmdHdlDomainPin(dn: DomainNode) {
    ext.updateGS(dn);
    // console.log("pin", dn, ext.gs.domainNodeFormat);
    // ext.domainDB.refresh(tools.splitDomaiNode(dn), true);
    const s = (new Date()).getTime()
    await ext.notesPanelView.parseDomain().showNotesPlanView();
    console.log("get notes time " + `${new Date().getTime() - s}`)
    await ext.setContext(ctxFilesExplorer, false);
  }
  // export async function cmdHdlNoteEditRemove() {
  //     const sqp = await window.showQuickPick(['Yes', 'No']);
  //     if (!sqp || sqp === 'No') return;
  //     ext.domainDB.removeNotes(tools.splitDomaiNode(ext.activeNote.dn!), ext.activeNote.nId!);
  //     // ext.dbFS.removeNotes(ext.activeNote.dpath, ext.activeNote.id!);
  //     ext.notesPanelView.parseDomain().showNotesPlanView();
  // }
  export async function cmdHdlDomainCategoryAdd() {
    const labels = await window.showInputBox({ placeHolder: 'label1,label2' });
    if (!labels) { return; };
    const _l = labels.split(',').map(l => l.trim());
    // ext.notebookDatabase.createCategory(tools.splitDomaiNode(ext.globalState.domainNode), cname, _labels);
    await cmdHdlNoteAdd(_l);
    await cmdHdlDomainPin(ext.gs.domainNode);
  }
  // labels is category labels.
  export async function cmdHdlNoteAdd(labels: string[]) {
    // const labelsOfDomain = ext.gs.nb.getLabelsOfDomain(ext.gs.domainNodeFormat);
    // const nId = ext.gs.nbNotes.addNote([...new Set(labelsOfDomain.concat(ext.gs.domainNodeFormat).concat(labels))]);
    // ext.gs.nb.addNote([...new Set(labelsOfDomain.concat(ext.gs.domainNodeFormat).concat(labels))]);
    ext.gs.nb.addNote(labels);
    // cmdHdlNoteEdit(nId);
    ext.vnNotebookSet.refresh(ext.gs.nbName);
    ext.domainProvider.refresh(ext.gs.domainNode);
    await cmdHdlDomainPin(ext.gs.domainNode);
  }
  export async function cmdHdlNoteFilesCreate(nId: string) {
    ext.gs.nb.getNoteById(nId).addFiles();
    ext.notesPanelView.parseDomain().showNotesPlanView();
    await cmdHdlNoteFilesOpen(nId);
  }
  export async function cmdHdlNoteEditFilesClose() {
    await ext.setContext(ctxFilesExplorer, true);
  }
  export async function cmdHdlNBNoteDocCreate(nId: string) {
    // ext.gs.nbNotes.addDoc(nId);
    ext.gs.nb.getNoteById(nId).addDoc();
    await commands.executeCommand(
      'editExplorer.openFileResource',
      Uri.file(ext.gs.nb.getNoteById(nId).getDocMainFile())
    );
  }
  // export async function cmdHdlDomainMove(dn: DomainNode) {
  //   const orgDNode = tools.splitDomaiNode(dn);
  //   const newDNodePath: string | undefined = await window.showInputBox({ value: dn });
  //   if (newDNodePath === undefined || dn === newDNodePath) { return; }
  //   const newDNode = tools.splitDomaiNode(newDNodePath);
  //   const qp = await window.showQuickPick([`Confirm Path: [${newDNodePath}]`, 'Cancel']);
  //   if (qp === 'Cancel' || qp === undefined) { return; }
  //   ext.gs.nbDomain.moveDomain(orgDNode, newDNode);
  //   ext.domainProvider.refresh();
  //   // for (let i = 0; i <= orgDNode.length; i++) {
  //   //   if (orgDNode[i] !== newDNode[i]) {
  //   //     const dpath = newDNode.slice(0, i);
  //   //     await ext.domainProvider.refresh(dpath.join('/'));
  //   //     await ext.domainTreeView.reveal(newDNode.join('/'));
  //   //     break;
  //   //   }
  //   // }
  //   // ext.domainProvider.refresh(tools.joinDomainNode(_dn.slice(0, _dn.length - 1)));
  // }
  export async function cmdHdlDomainRename(dn: DomainNode) {
    const _dn = tools.splitDomaiNode(dn);
    const orgName = _dn[_dn.length - 1];
    const newName: string | undefined = await window.showInputBox({ value: orgName });
    if (!newName || orgName === newName) { return; }
    ext.gs.nb.renameDomain(_dn, newName);
    ext.domainProvider.refresh(tools.joinDomainNode(_dn.slice(0, _dn.length - 1)));
  }
  export async function cmdHdlDomainRemove(dn: DomainNode) {
    const _dn = tools.splitDomaiNode(dn);
    const domainName = _dn[_dn.length - 1];
    const confirm = await window.showInputBox({
      title: 'Are you absolutely sure?',
      placeHolder: `Please type '${domainName}' to confirm.`
    });
    if (confirm !== domainName) {
      window.showInformationMessage(`Input is not '${domainName}'.`);
      return;
    } else if (confirm === domainName) {
      if ((await window.showInformationMessage(`Remove domain '${domainName}'?`, 'Yes', 'No')) !== 'Yes') { return; };
    }
    // ext.gs.nbDomain.deleteDomain(_dn);
    ext.gs.nb.deleteDomain(_dn);
    ext.domainProvider.refresh();
  }
  export async function cmdHdlDomainSearch(_dn: DomainNode) {
    window.showInformationMessage('soon');
  }
  export async function cmdHdlNoteOpenFolder(_nId: string) {
    // await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getDirectory(nId)), true);
  }
  export async function cmdHdlNotebookNoteDocShow(nId: string) {
    const docMainfFile = ext.gs.nb.getNoteById(nId).getDocMainFile();
    // // Uri.file(ext.domainDB.noteDB.getDocIndexFile(nId, 'main.md')
    // if (basename(readmeFile).split('.')[1] === 'md') {
    const uri = Uri.file(docMainfFile);
    await commands.executeCommand('markdown.showPreviewToSide', uri);
    // } else {
    //     noteDocHtmlPanel(readmeFile);
    // }
  }
  export async function cmdHdlNoteFilesOpen(nId: string) {
    ext.gs.nId = nId;
    ext.filesProvider.refresh();
    await ext.setContext(ctxFilesExplorer, true);
  }
  export async function cmdHdlFilesClose() {
    await ext.setContext(ctxFilesExplorer, false);
  }
  export async function cmdHdlFilesEditOpen() {
    await commands.executeCommand('vscode.openFolder', Uri.file(ext.gs.nb.getNoteById(ext.gs.nId).getFilesPath()), true);
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
    ext.vnNotebookSet.refresh();
    ext.domainProvider.refresh();
    window.showInformationMessage('refresh domain complete.');
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
  export async function cmdHdlNBNoteRemove(nId: string) {
    const dn = tools.splitDomaiNode(ext.gs.domainNode);
    const selection = await window.showInformationMessage(`delete note ${nId}?`, 'Yes', 'No');
    if (selection !== 'Yes') { return; };
    ext.gs.nb.deleteNote(nId);
    await cmdHdlDomainPin(ext.gs.domainNode);
    ext.domainProvider.refresh(dn[0]);

    // ext.notesPanelView.removeNote(nId);
  }
  // export async function cmdHdlNoteColToActiveTermianl(_nId: string, _cIdx: string) {
  //   // if (window.activeTerminal) {
  //   //     const colContent = ext.domainDB.noteDB.getNoteContents(nId)[Number(cIdx)];
  //   //     window.activeTerminal.sendText(colContent);
  //   // }
  // }
  // export async function cmdHdlNotesRelabels(labels: string, nIds: string[]) {
  //   const _labels = labels.split(',').map(l => l.trim());
  //   // const x = window.createQuickPick();
  //   // window.showQuickPick
  //   // x.items = [{ label: "1", picked: true }];
  //   // x.onDidHide(() => x.dispose());
  //   // x.show();
  //   // const x = await window.showQuickPick([{ label: "s", picked: true }, { label: "2", picked: true }], { canPickMany: true })


  //   // const labels = ext.notebookDatabase.getDomain(ext.globalState.domainNodeFormat)['.labels'];
  //   const cl: string | undefined = await window.showInputBox({ value: labels });
  //   if (cl === undefined || cl === labels) { return; }
  //   for (const nId of nIds) {
  //     const note = ext.notebookDatabase.getNBNotes(ext.globalState.nbName)[nId];
  //     note.labels = note.labels.filter(l => !_labels.includes(l)).concat(cl.split(',').map(l => l.trim()));
  //   }
  //   ext.notebookDatabase.permanentNBNotes(ext.globalState.nbName);
  //   ext.notesPanelView.parseDomain().showNotesPlanView();
  // }
  export async function cmdHdlNotesEditlabels(labels: string[]) {
    // const oldLabels = labels.map(l => l.trim());
    // const ib = await window.showInputBox({ value: oldLabels.join(',') });
    // if (ib === undefined || ib === oldLabels.join(',')) { return; }

    ext.gs.nb.createEditNotesSetLabelsEnv(ext.gs.domainNodeFormat, labels);
    commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.gs.nb.editFile));
    // const newLabels = ib.split(',').map(l => l.trim());
    // const labelsOfDomain = ext.gs.nb.getLabelsOfDomain(ext.gs.domainNodeFormat);
    // nIds.forEach(nId => {
    //   ext.gs.nb.resetLabels(nId, newLabels.concat(labelsOfDomain));
    // });
    ext.vnNotebookSet.refresh(ext.gs.nbName);
    // ext.gs.vnNotes.permanent();
    ext.domainProvider.refresh();
    ext.notesPanelView.parseDomain().showNotesPlanView();
  }
  export async function cmdHdlDomainEditlabels() {
    ext.gs.nb.createEditDomainEnv(ext.gs.domainNodeFormat);
    commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.gs.nb.editFile));
    // After the modification is complete, the listening is triggered

    // const labelsOfDomain = ext.gs.nb.getLabelsOfDomain(ext.gs.domainNodeFormat);
    // const ib = await window.showInputBox({ value: labelsOfDomain.join(', ') });
    // if (ib === undefined || ib === labelsOfDomain.join(', ')) { return; }
    // ext.domainDB.createDomain(tools.splitDomaiNode(dn))
    // ext.gs.nb.getDomainByNode(ext.gs.domainNodeFormat).resetLabels(ib.split(',').map(l => l.trim()));
    // ext.domainProvider.refresh(dn);
    // await cmdHdlDomainCategoryAdd();
    // await cmdHdlDomainPin(dn);
    // cmdHdlDomainPin(ext.gs.domainNode);
  }

  // export async function cmdHdlNoteColToActiveTermianlWithArgs(_nId: string, _cIdx: string) {
  //   // if (window.activeTerminal) {
  //   //     const colContent = ext.domainDB.noteDB.getNoteContents(nId)[Number(cIdx)];
  //   //     window.activeTerminal.sendText(colContent);
  //   // }
  // }
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
