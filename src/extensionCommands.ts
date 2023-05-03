import { existsSync, statSync } from 'fs-extra';
import { commands, Uri, window, workspace } from 'vscode';

import { ctxFilesExplorer, jointMark, nbGroup, pathSplit, section } from './constants';
import { ext } from './extensionVariables';
import { arrayLabels2GroupLabels, tools } from './helper';
import { DomainNode } from './types';

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
    const dns = dn.split(pathSplit);
    ext.lnbs.get(dns[0]).getld().updateGls(dns, { 'domain': dns });
    ext.lnbs.get(dns[0]).getln().create({ 'domain': dns });
    ext.domainProvider.refresh(dn);
    ext.lwebPanelView.setdn(dns).show('domain');
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
      const dna = dn.split(pathSplit);
      ext.lnbs.get(dn.split(pathSplit)[0]).getld().create(dna.concat(name));
    }
    ext.domainProvider.refresh(dn);
  }
  export async function cmdHdlDomainPin(dn: DomainNode) {
    // ext.gs.update(dn.split(pathSplit)[0]);
    await ext.lwebPanelView.setdn(dn.split(pathSplit)).show('domain');
    // await ext.lwebPanelView.show();
    await ext.setContext(ctxFilesExplorer, false);
  }
  export async function cmdHdlNoteFilesCreate(params: { nb: string, nId: string }) {
    const nb = ext.lnbs.get(params.nb);
    nb.getln().getById(params.nId).createFiles();
    // ext.notesPanelView.parseDomain().showNotesPlanView();
    await cmdHdlNoteFilesOpen(params);
    await ext.lwebPanelView.refresh();
  }
  export async function cmdHdlNoteEditFilesClose() {
    await ext.setContext(ctxFilesExplorer, true);
  }
  export async function cmdHdlNBNoteDocCreate(params: { nb: string, nId: string }) {
    const nb = ext.lnbs.get(params.nb);
    nb.getln().getById(params.nId).createDoc();
    await commands.executeCommand(
      'editExplorer.openFileResource',
      Uri.file(nb.getln().getById(params.nId).getDocMainFile())
    );
    await ext.lwebPanelView.refresh();
  }
  export async function cmdHdlDomainRename(dn: DomainNode) {
    const dns = tools.splitDomaiNode(dn);
    const oname = dns[dns.length - 1];
    const nname: string | undefined = await window.showInputBox({ value: oname });
    if (!nname || oname === nname) { return; }

    ext.lnbs.get(dns[0]).getld().renameDomain(dns, nname);
    if (dns.length === 1) {
      ext.lnbs.rename(dns[0], nname);
    }

    dns[dns.length - 1] = nname;

    if (
      ext.lwebPanelView.visible()
      && ext.lnbs.get(dns[0]).getNotesOfDomain(dns).length >= 1
    ) {
      ext.lwebPanelView.setdn(dns).show('domain');
    }
    ext.domainProvider.refresh(tools.joinDomainNode(dns.slice(0, dns.length - 1)));
  }
  export async function cmdHdlDomainRemove(dn: DomainNode) {
    const _dn = tools.splitDomaiNode(dn);
    const domainName = _dn[_dn.length - 1];

    const nd = await window.showQuickPick(['remove: notes', 'remove: domain']);
    if (nd === undefined) {
      return;
    }

    const confirm = await window.showInputBox({
      title: 'Are you absolutely sure?',
      placeHolder: `Please type '${nd}' to confirm.`,
      prompt: `Please type '${nd}' to confirm.`
    });
    if (confirm !== domainName) {
      window.showInformationMessage(`Input is not '${domainName}'.`);
      return;
    }
    if (nd.includes('domain')) {
      if (_dn.length === 1) {
        ext.lnbs.remove(_dn[0]);
      } else {
        ext.lnbs.get(_dn[0]).getld().remove(_dn);
      }
    } else if (nd.includes('notes')) {
      ext.lnbs.get(_dn[0]).getld().deleteNotes(_dn);
    }
    ext.domainProvider.refresh();
    await ext.lwebPanelView.dispose();
  }
  export async function cmdHdlGlobalSearch() {
    await ext.lwebPanelView.show('search');
  }
  export async function cmdHdlNotebookSearch() {
    await ext.lwebPanelView.show('search');
  }
  export async function cmdHdlNoteDocShow(params: { nb: string, nId: string }) {
    const nb = ext.lnbs.get(params.nb);
    const docMainfFile = nb.getln().getById(params.nId).getDocMainFile();
    await commands.executeCommand('markdown.showPreviewToSide', Uri.file(docMainfFile));
  }
  export async function cmdHdlNoteFilesOpen(params: { nb: string, nId: string }) {
    ext.gs.update(params.nb);
    ext.gs.id = params.nId;
    ext.filesProvider.refresh();
    await ext.setContext(ctxFilesExplorer, true);
  }
  export async function cmdHdlFilesClose() {
    await ext.setContext(ctxFilesExplorer, false);
  }
  export async function cmdHdlFilesOpen() {
    if (ext.gs.lnb) {
      await commands.executeCommand('vscode.openFolder', Uri.file(ext.gs.lnb.getln().getById(ext.gs.id).getFilesPath()), true);
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
    if (ext.lnbs.editor.trySetEditor('note')) {
      window.showWarningMessage('Please process the editor first.');
    } else {
      ext.lnbs.createNoteEditor(params.nb, params.nId);
    }
    commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.lnbs.editor.getEditorFile()));
  }
  export async function cmdHdlNoteAdd(als: string[]) {
    const nbn = als.filter(l => l.startsWith(`${nbGroup}${jointMark}`))[0].split(jointMark)[1];
    ext.lnbs.get(nbn).getln().create(arrayLabels2GroupLabels(als));
    const lid = ext.lnbs.get(nbn).getln().getLastId();
    cmdHdlNoteEditor({ nb: nbn, nId: lid });
  }
  export async function cmdHdlDomainGlsEdit(params: { dn: string[] }) {
    if (ext.lnbs.editor.trySetEditor('domaingls')) {
      window.showWarningMessage('Please process the editor first.');
    } else {
      ext.lnbs.createDomainGlsEditor(params.dn);
    }
    commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.lnbs.editor.getEditorFile()));
  }
  export async function cmdHdlCategoryNoteAdd(params: { nb: string, als: string[] }) {
    cmdHdlNoteAdd(params.als);
  }
  export async function cmdHdlNotesGroupLabelsEdit(params: { als: string[] }) {
    if (ext.lnbs.editor.trySetEditor('notesgls')) {
      window.showWarningMessage('Please process the editor first.');
    } else {
      ext.lnbs.createNotesGroupLabelsEditor(params.als);
    }
    commands.executeCommand('editExplorer.openFileResource', Uri.file(ext.lnbs.editor.getEditorFile()));
  }
  export async function cmdHdlNoteRemove(params: { nb: string, id: string }) {
    if (await window.showQuickPick(['Yes', 'No'], { title: `Confirm delete nb:${params.nb}, id:${params.id}.`, placeHolder: `Confirm delete nb:${params.nb}, id:${params.id}.` }) === "Yes") {
      ext.lnbs.get(params.nb).getln().delete(params.id);
      ext.lwebPanelView.refresh();
    }
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
