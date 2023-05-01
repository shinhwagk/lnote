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
    const dna = dn.split(pathSplit);
    ext.lnbs.get(dna[0]).craeteNotes(dna);
    // ext.gs.update(dn.split(pathSplit)[0]);
    // const labelsOfDomain = await window.showInputBox({ value: ext.gs.domainNodeFormat.join(', ') });
    // if (labelsOfDomain === undefined) { return; };
    // const _l = labelsOfDomain.split(',').map(l => l.trim());
    // ext.gs.lnb.createDomainEditor(ext.gs.domainNodeFormat);
    // ext.vnNotebookSet.refresh(ext.gs.nbName);
    ext.domainProvider.refresh(dn);
    ext.lwebPanelView.setdn(dna).show('domain');
    // await cmdHdlDomainPin(dn);
  }
  export async function cmdHdlDomainCreate(dn?: DomainNode) {
    const name: string | undefined = await window.showInputBox();
    if (name === undefined || name === '') { return; };
    if (name.includes('/')) {
      window.showErrorMessage('domain name cannot contain "/".');
      return;
    }
    if (dn === undefined) {
      ext.lnbs.create(name);
    } else {
      console.log("211", dn);
      const dna = dn.split(pathSplit);
      ext.lnbs.get(dn.split(pathSplit)[0]).addDomain(dna.concat(name));
    }
    // ext.updateGS(dn!);
    // console.log('dfsdfds', ext.gs.domainNodeFormat);
    // ext.gs.lnb.createDomainEditor(ext.gs.domainNodeFormat);
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
    ext.domainProvider.refresh(dn);
    // !dn || ext.domainTreeView.reveal(dn, { expand: true });
  }
  export async function cmdHdlDomainPin(dn: DomainNode) {
    // ext.gs.update(dn.split(pathSplit)[0]);
    await ext.lwebPanelView.setdn(dn.split(pathSplit)).show('domain');
    // await ext.lwebPanelView.show();
    await ext.setContext(ctxFilesExplorer, false);
  }
  export async function cmdHdlNoteFilesCreate(params: { nb: string, nId: string }) {
    const nb = ext.lnbs.get(params.nb);
    nb.getNoteById(params.nId).addFiles();
    // ext.notesPanelView.parseDomain().showNotesPlanView();
    await cmdHdlNoteFilesOpen(params);
  }
  export async function cmdHdlNoteEditFilesClose() {
    await ext.setContext(ctxFilesExplorer, true);
  }
  export async function cmdHdlNBNoteDocCreate(params: { nb: string, nId: string }) {
    const nb = ext.lnbs.get(params.nb);
    nb.getNoteById(params.nId).addDoc();
    await commands.executeCommand(
      'editExplorer.openFileResource',
      Uri.file(nb.getNoteById(params.nId).getDocMainFile())
    );
    await ext.lwebPanelView.refresh()
  }
  export async function cmdHdlDomainRename(dn: DomainNode) {
    const _dn = tools.splitDomaiNode(dn);
    const orgName = _dn[_dn.length - 1];
    const newName: string | undefined = await window.showInputBox({ value: orgName });
    if (!newName || orgName === newName) { return; }
    ext.gs.lnb?.renameDomain(_dn, newName);
    ext.domainProvider.refresh(tools.joinDomainNode(_dn.slice(0, _dn.length - 1)));
  }
  export async function cmdHdlDomainRemove(dn: DomainNode) {
    const _dn = tools.splitDomaiNode(dn);
    const domainName = _dn[_dn.length - 1];
    const confirm = await window.showInputBox({
      title: 'Are you absolutely sure?',
      placeHolder: `Please type '${domainName}' to confirm.`,
      prompt: `Please type '${domainName}' to confirm.`

    });
    if (confirm !== domainName) {
      window.showInformationMessage(`Input is not '${domainName}'.`);
      return;
    }
    if (_dn.length === 1) {
      ext.lnbs.remove(_dn[0]);
    } else {
      ext.lnbs.get(_dn[0]).removeDomain(_dn);
    }
    ext.domainProvider.refresh();
  }
  export async function cmdHdlGlobalSearch() {
    await ext.lwebPanelView.show('search');
  }
  export async function cmdHdlNotebookSearch() {
    await ext.lwebPanelView.show('search');
  }
  export async function cmdHdlNoteOpenFolder(_nId: string) {
    // await commands.executeCommand('vscode.openFolder', Uri.file(ext.domainDB.noteDB.getDirectory(nId)), true);
  }
  export async function cmdHdlNoteDocShow(params: { nb: string, nId: string }) {
    const nb = ext.lnbs.get(params.nb);
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
    if (ext.gs.lnb) {
      await commands.executeCommand('vscode.openFolder', Uri.file(ext.gs.lnb.getNoteById(ext.gs.nId).getFilesPath()), true);
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
    ext.lnbs.refresh();
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
    // const nb = ext.lnbs.get(params.nb);
    console.log(params);
    ext.lnbs.createNoteEditor(params.nb, params.nId);
    // ext.gs.nb.createNoteEditor(params.nId, params.labels);
    // if (kind === 'nsgl') {
    //   ext.gs.nb.createNotesSetGroupLabelsEditor(ext.gs.domainNodeFormat, params.labels);
    // } else if (kind === 'edgl') {
    //   ext.gs.nb.createDomainEditor(ext.gs.domainNodeFormat);
    // } else if (kind === 'end') {
    //   ext.gs.nb.createNoteEditor(params.nbName, params.nId, params.labels);
    // }
    commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.lnbs.getEditorFile()));
  }
  export async function cmdHdlNoteAdd(params: { als: string[], nb: string }) {
    // const nb = ext.lnbs.get(params.nb);
    ext.lnbs.get(params.nb as string).addNoteByAl(params.als);
    const notes = [...ext.lnbs.get(params.nb).getln().getCache().entries()];
    const nid = notes[notes.length - 1][0];
    console.log(params.nb, nid);
    cmdHdlNoteEditor({ nb: params.nb, nId: nid });
    // cmdHdlNoteEditor()
    // ext.gs.nb.createNoteEditor(params.nId, params.labels);
    // if (kind === 'nsgl') {
    //   ext.gs.nb.createNotesSetGroupLabelsEditor(ext.gs.domainNodeFormat, params.labels);
    // } else if (kind === 'edgl') {
    //   ext.gs.nb.createDomainEditor(ext.gs.domainNodeFormat);
    // } else if (kind === 'end') {
    //   ext.gs.nb.createNoteEditor(params.nbName, params.nId, params.labels);
    // }
    // commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.lnbs.getEditorFile1()));
  }

  export async function cmdHdlDomainNoteAdd(params: { dn: string[] }) {
    // const nb = ext.lnbs.get(params.nb);
    const als = ext.lnbs.get(params.dn[0]).getArrayLabelsOfDomain(params.dn);
    cmdHdlNoteAdd({ als: als, nb: params.dn[0] });
    // const notes = [...ext.lnbs.get(params.nb).getln().getCache().entries()];
    // const nid = notes[notes.length - 1][0];
    // console.log(params.nb, nid);
    // cmdHdlNoteEditor({ nb: params.nb, nId: nid });
  }

  export async function cmdHdlDomainGroupLabelsEdit(params: { dn: string[] }) {
    //   // const nb = ext.lnbs.get(params.nb);
    //   const als = ext.lnbs.get(params.dn[0]).getArrayLabelsOfDomain(params.dn);
    //   cmdHdlNoteAdd({ als: als, nb: params.dn[0] });
    //   // const notes = [...ext.lnbs.get(params.nb).getln().getCache().entries()];
    //   // const nid = notes[notes.length - 1][0];
    //   // console.log(params.nb, nid);
    // cmdHdlNoteEditor({ nb: params.nb, nId: nid });
    ext.lnbs.createDomainEditor(params.dn);
    commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.lnbs.getEditorFile()));
  }

  export async function cmdHdlCategoryNoteAdd(params: { nb: string, als: string[] }) {
    cmdHdlNoteAdd(params);
  }

  export async function cmdHdlNotesGroupLabelsEdit(params: { als: string[] }) {
    ext.lnbs.createNotesGroupLabelsEditor(params.als);
    commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.lnbs.getEditorFile()));
    // cmdHdlNoteAdd(params);
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
