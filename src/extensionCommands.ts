import { existsSync, statSync } from 'fs-extra';
import { commands, Uri, window, workspace } from 'vscode';

import { ctxFilesExplorer, pathSplit, section } from './constants';
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
  export async function cmdHdlDomainNotesCreate(dn: DomainNode) {
    ext.updateGS(dn);
    // const labelsOfDomain = await window.showInputBox({ value: ext.gs.domainNodeFormat.join(', ') });
    // if (labelsOfDomain === undefined) { return; };
    // const _l = labelsOfDomain.split(',').map(l => l.trim());
    ext.gs.nb.createDomainEditor(ext.gs.domainNodeFormat);
    // ext.vnNotebookSet.refresh(ext.gs.nbName);
    // ext.domainProvider.refresh(dn);
    // await cmdHdlDomainPin(dn);
  }
  export async function cmdHdlDomainCreate(dn?: DomainNode) {
    console.log('msdfsdf');
    const _dn: string[] = dn ? tools.splitDomaiNode(dn) : [];
    ext.updateGS(dn!);
    console.log('dfsdfds', ext.gs.domainNodeFormat);
    ext.gs.nb.createDomainEditor(ext.gs.domainNodeFormat);
    // const name: string | undefined = await window.showInputBox();
    // if (!name) { return; };
    // if (name.includes('/')) {
    //   window.showErrorMessage('domain name cannot contain "/".');
    // }
    // if (dn === undefined) {
    //   ext.vnNotebookSet.createNB(name);
    // }
    // ext.updateGS(dn || name);
    // ext.gs.nb.addDomain(_dn.concat(name));
    // ext.domainProvider.refresh(dn);
    // !dn || ext.domainTreeView.reveal(dn, { expand: true });
  }
  export async function cmdHdlDomainPin(dn: DomainNode) {
    ext.gs.update(dn.split(pathSplit)[0]);
    // console.log("pin", dn, ext.gs.domainNodeFormat);
    // ext.domainDB.refresh(tools.splitDomaiNode(dn), true);
    const s = (new Date()).getTime();
    ext.webState.selectedArraylabels = ext.webState.selectedArraylabels.length === 0
      ? ext.gs.nb?.getArrayLabelsOfDomain(ext.gs.domainNodeFormat)
      : ext.webState.selectedArraylabels;
    // ext.webState.notes = ext.gs.nb.getNotesByArrayLabels(ext.webState.selectedArraylabels);

    await ext.notesPanelView.parseDomain().showNotesPlanView();
    console.log("get notes time " + `${new Date().getTime() - s}`);
    await ext.setContext(ctxFilesExplorer, false);
  }
  export async function cmdHdlNoteFilesCreate(params: { nb: string, nId: string }) {
    const nb = ext.vnNotebookSet.getNB(params.nb);
    nb.getNoteById(params.nId).addFiles();
    // ext.notesPanelView.parseDomain().showNotesPlanView();
    await cmdHdlNoteFilesOpen(params);
  }
  export async function cmdHdlNoteEditFilesClose() {
    await ext.setContext(ctxFilesExplorer, true);
  }
  export async function cmdHdlNBNoteDocCreate(params: { nb: string, nId: string }) {
    const nb = ext.vnNotebookSet.getNB(params.nb);
    nb.getNoteById(params.nId).addDoc();
    await commands.executeCommand(
      'editExplorer.openFileResource',
      Uri.file(nb.getNoteById(params.nId).getDocMainFile())
    );
  }
  export async function cmdHdlDomainRename(dn: DomainNode) {
    const _dn = tools.splitDomaiNode(dn);
    const orgName = _dn[_dn.length - 1];
    const newName: string | undefined = await window.showInputBox({ value: orgName });
    if (!newName || orgName === newName) { return; }
    ext.gs.nb?.renameDomain(_dn, newName);
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
    ext.gs.nb?.deleteDomain(_dn);
    ext.domainProvider.refresh();
  }
  export async function cmdHdlGlobalSearch(_dn: DomainNode) {
    await ext.searchPanelView.show();
  }
  export async function cmdHdlNoteOpenFolder(_nId: string) {
    // await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getDirectory(nId)), true);
  }
  export async function cmdHdlNotebookNoteDocShow(params: { nb: string, nId: string }) {
    const nb = ext.vnNotebookSet.getNB(params.nb);
    const docMainfFile = nb.getNoteById(params.nId).getDocMainFile();
    // // Uri.file(ext.domainDB.noteDB.getDocIndexFile(nId, 'main.md')
    // if (basename(readmeFile).split('.')[1] === 'md') {
    const uri = Uri.file(docMainfFile);
    await commands.executeCommand('markdown.showPreviewToSide', uri);
    // } else {
    //     noteDocHtmlPanel(readmeFile);
    // }
  }
  export async function cmdHdlNoteFilesOpen(params: { nb: string, nId: string }) {
    ext.gs.update(params.nb);
    ext.gs.nId = params.nId;
    ext.filesProvider.refresh();
    await ext.setContext(ctxFilesExplorer, true);
  }
  export async function cmdHdlFilesClose() {
    await ext.setContext(ctxFilesExplorer, false);
  }
  export async function cmdHdlFilesOpen() {
    if (ext.gs.nb) {
      await commands.executeCommand('vscode.openFolder', Uri.file(ext.gs.nb.getNoteById(ext.gs.nId).getFilesPath()), true);
    }
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
  // export async function cmdHdShortcutsLast() {
  //     const picks = ext.domainDB.getShortcutsList('last');
  //     const pick = await window.showQuickPick(picks);
  //     if (!pick) return;
  //     await cmdHdlDomainPin(pick);
  // }
  // export async function cmdHdlNoteColToActiveTermianl(_nId: string, _cIdx: string) {
  //   // if (window.activeTerminal) {
  //   //     const colContent = ext.domainDB.noteDB.getNoteContents(nId)[Number(cIdx)];
  //   //     window.activeTerminal.sendText(colContent);
  //   // }
  // }
  export async function cmdHdlNoteEditor(params: any) {
    const nb = ext.vnNotebookSet.getNB(params.nb);
    nb.createNoteEditor(params.nId);
    // ext.gs.nb.createNoteEditor(params.nId, params.labels);
    // if (kind === 'nsgl') {
    //   ext.gs.nb.createNotesSetGroupLabelsEditor(ext.gs.domainNodeFormat, params.labels);
    // } else if (kind === 'edgl') {
    //   ext.gs.nb.createDomainEditor(ext.gs.domainNodeFormat);
    // } else if (kind === 'end') {
    //   ext.gs.nb.createNoteEditor(params.nbName, params.nId, params.labels);
    // }
    commands.executeCommand('editExplorer.openFileResource', Uri.file(nb.getEditorFile()));
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
}
