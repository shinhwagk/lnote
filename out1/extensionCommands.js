"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtCmds = void 0;
const fs_extra_1 = require("fs-extra");
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const extensionVariables_1 = require("./extensionVariables");
const helper_1 = require("./helper");
var ExtCmds;
(function (ExtCmds) {
    async function cmdHdlChooseLocation() {
        // { title: 'choose lnote data location.' }
        const dl = await vscode_1.window.showInputBox();
        if (dl === undefined || dl === '') {
            return;
        }
        ;
        if (!(0, fs_extra_1.existsSync)(dl)) {
            vscode_1.workspace.getConfiguration(constants_1.section).update('notespath', dl, 1);
        }
        else {
            if (!(0, fs_extra_1.statSync)(dl).isDirectory()) {
                vscode_1.window.showInformationMessage('Make sure the directory already exists.');
            }
            else {
                vscode_1.workspace.getConfiguration(constants_1.section).update('notespath', dl, 1);
            }
        }
    }
    ExtCmds.cmdHdlChooseLocation = cmdHdlChooseLocation;
    async function cmdHdlDomainNotesCreate(dn) {
        const dns = dn.split(constants_1.pathSplit);
        extensionVariables_1.ext.lnbs.get(dns[0]).getld().updateGls(dns, { 'domain': dns });
        extensionVariables_1.ext.lnbs.get(dns[0]).getln().create({ 'domain': dns });
        extensionVariables_1.ext.domainProvider.refresh(dn);
        extensionVariables_1.ext.lwebPanelView.setdn(dns).show('domain');
    }
    ExtCmds.cmdHdlDomainNotesCreate = cmdHdlDomainNotesCreate;
    async function cmdHdlDomainCreate(dn) {
        const name = await vscode_1.window.showInputBox();
        if (name === undefined || name === '') {
            return;
        }
        ;
        if (name.includes('/')) {
            vscode_1.window.showErrorMessage('domain name cannot contain "/".');
            return;
        }
        if (dn === undefined) {
            extensionVariables_1.ext.lnbs.create(name);
        }
        else {
            const dna = dn.split(constants_1.pathSplit);
            extensionVariables_1.ext.lnbs.get(dn.split(constants_1.pathSplit)[0]).getld().create(dna.concat(name));
        }
        extensionVariables_1.ext.domainProvider.refresh(dn);
    }
    ExtCmds.cmdHdlDomainCreate = cmdHdlDomainCreate;
    async function cmdHdlDomainPin(dn) {
        // ext.gs.update(dn.split(pathSplit)[0]);
        await extensionVariables_1.ext.lwebPanelView.setdn(dn.split(constants_1.pathSplit)).show('domain');
        // await ext.lwebPanelView.show();
        await extensionVariables_1.ext.setContext(constants_1.ctxFilesExplorer, false);
    }
    ExtCmds.cmdHdlDomainPin = cmdHdlDomainPin;
    async function cmdHdlNoteFilesCreate(params) {
        const nb = extensionVariables_1.ext.lnbs.get(params.nb);
        nb.getln().getById(params.nId).createFiles();
        // ext.notesPanelView.parseDomain().showNotesPlanView();
        await cmdHdlNoteFilesOpen(params);
        await extensionVariables_1.ext.lwebPanelView.refresh();
    }
    ExtCmds.cmdHdlNoteFilesCreate = cmdHdlNoteFilesCreate;
    async function cmdHdlNoteEditFilesClose() {
        await extensionVariables_1.ext.setContext(constants_1.ctxFilesExplorer, true);
    }
    ExtCmds.cmdHdlNoteEditFilesClose = cmdHdlNoteEditFilesClose;
    async function cmdHdlNBNoteDocCreate(params) {
        const nb = extensionVariables_1.ext.lnbs.get(params.nb);
        nb.getln().getById(params.nId).createDoc();
        await vscode_1.commands.executeCommand('editExplorer.openFileResource', vscode_1.Uri.file(nb.getln().getById(params.nId).getDocMainFile()));
        await extensionVariables_1.ext.lwebPanelView.refresh();
    }
    ExtCmds.cmdHdlNBNoteDocCreate = cmdHdlNBNoteDocCreate;
    async function cmdHdlDomainRename(dn) {
        const dns = helper_1.tools.splitDomaiNode(dn);
        const oname = dns[dns.length - 1];
        const nname = await vscode_1.window.showInputBox({ value: oname });
        if (!nname || oname === nname) {
            return;
        }
        extensionVariables_1.ext.lnbs.get(dns[0]).getld().renameDomain(dns, nname);
        if (dns.length === 1) {
            extensionVariables_1.ext.lnbs.rename(dns[0], nname);
        }
        dns[dns.length - 1] = nname;
        if (extensionVariables_1.ext.lwebPanelView.visible()
            && extensionVariables_1.ext.lnbs.get(dns[0]).getNotesOfDomain(dns).length >= 1) {
            extensionVariables_1.ext.lwebPanelView.setdn(dns).show('domain');
        }
        extensionVariables_1.ext.domainProvider.refresh(helper_1.tools.joinDomainNode(dns.slice(0, dns.length - 1)));
    }
    ExtCmds.cmdHdlDomainRename = cmdHdlDomainRename;
    async function cmdHdlDomainRemove(dn) {
        const _dn = helper_1.tools.splitDomaiNode(dn);
        const domainName = _dn[_dn.length - 1];
        const nd = await vscode_1.window.showQuickPick(['remove: notes', 'remove: domain']);
        if (nd === undefined) {
            return;
        }
        const confirm = await vscode_1.window.showInputBox({
            title: 'Are you absolutely sure?',
            placeHolder: `Please type '${nd}' to confirm.`,
            prompt: `Please type '${nd}' to confirm.`
        });
        if (confirm !== domainName) {
            vscode_1.window.showInformationMessage(`Input is not '${domainName}'.`);
            return;
        }
        if (nd.includes('domain')) {
            if (_dn.length === 1) {
                extensionVariables_1.ext.lnbs.remove(_dn[0]);
            }
            else {
                extensionVariables_1.ext.lnbs.get(_dn[0]).getld().remove(_dn);
            }
        }
        else if (nd.includes('notes')) {
            extensionVariables_1.ext.lnbs.get(_dn[0]).getld().deleteNotes(_dn);
        }
        extensionVariables_1.ext.domainProvider.refresh();
        await extensionVariables_1.ext.lwebPanelView.dispose();
    }
    ExtCmds.cmdHdlDomainRemove = cmdHdlDomainRemove;
    async function cmdHdlGlobalSearch() {
        await extensionVariables_1.ext.lwebPanelView.show('search');
    }
    ExtCmds.cmdHdlGlobalSearch = cmdHdlGlobalSearch;
    async function cmdHdlNotebookSearch() {
        await extensionVariables_1.ext.lwebPanelView.show('search');
    }
    ExtCmds.cmdHdlNotebookSearch = cmdHdlNotebookSearch;
    async function cmdHdlNoteDocShow(params) {
        const nb = extensionVariables_1.ext.lnbs.get(params.nb);
        const docMainfFile = nb.getln().getById(params.nId).getDocMainFile();
        await vscode_1.commands.executeCommand('markdown.showPreviewToSide', vscode_1.Uri.file(docMainfFile));
    }
    ExtCmds.cmdHdlNoteDocShow = cmdHdlNoteDocShow;
    async function cmdHdlNoteFilesOpen(params) {
        extensionVariables_1.ext.gs.update(params.nb);
        extensionVariables_1.ext.gs.id = params.nId;
        extensionVariables_1.ext.filesProvider.refresh();
        await extensionVariables_1.ext.setContext(constants_1.ctxFilesExplorer, true);
    }
    ExtCmds.cmdHdlNoteFilesOpen = cmdHdlNoteFilesOpen;
    async function cmdHdlFilesClose() {
        await extensionVariables_1.ext.setContext(constants_1.ctxFilesExplorer, false);
    }
    ExtCmds.cmdHdlFilesClose = cmdHdlFilesClose;
    async function cmdHdlFilesOpen() {
        if (extensionVariables_1.ext.gs.lnb) {
            await vscode_1.commands.executeCommand('vscode.openFolder', vscode_1.Uri.file(extensionVariables_1.ext.gs.lnb.getln().getById(extensionVariables_1.ext.gs.id).getFilesPath()), true);
        }
    }
    ExtCmds.cmdHdlFilesOpen = cmdHdlFilesOpen;
    async function cmdHdlFilesRefresh() {
        extensionVariables_1.ext.filesProvider.refresh();
    }
    ExtCmds.cmdHdlFilesRefresh = cmdHdlFilesRefresh;
    async function cmdHdlFilesOpenTerminal() {
        // const nId = ext.globalState.nId;
        // const dpath = tools.splitDomaiNode(ext.globalState.domainNode!);
        // const filePath = ext.domainDB.noteDB.getFilesPath(nId);
        // const fileTerminal = window.createTerminal({ name: `${dpath} - ${nId}`, cwd: filePath });
        // fileTerminal.show(true);
    }
    ExtCmds.cmdHdlFilesOpenTerminal = cmdHdlFilesOpenTerminal;
    async function cmdHdlDomainRefresh() {
        extensionVariables_1.ext.lnbs.refresh();
        extensionVariables_1.ext.domainProvider.refresh();
        vscode_1.window.showInformationMessage('refresh domain complete.');
    }
    ExtCmds.cmdHdlDomainRefresh = cmdHdlDomainRefresh;
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
    async function cmdHdlNoteEditor(params) {
        if (extensionVariables_1.ext.lnbs.editor.trySetEditor('note')) {
            vscode_1.window.showWarningMessage('Please process the editor first.');
        }
        else {
            extensionVariables_1.ext.lnbs.createNoteEditor(params.nb, params.nId);
        }
        vscode_1.commands.executeCommand('editExplorer.openFileResource', vscode_1.Uri.file(extensionVariables_1.ext.lnbs.editor.getEditorFile()));
    }
    ExtCmds.cmdHdlNoteEditor = cmdHdlNoteEditor;
    async function cmdHdlNoteAdd(als) {
        const nbn = als.filter(l => l.startsWith(`${constants_1.nbGroup}${constants_1.jointMark}`))[0].split(constants_1.jointMark)[1];
        extensionVariables_1.ext.lnbs.get(nbn).getln().create((0, helper_1.arrayLabels2GroupLabels)(als));
        const lid = extensionVariables_1.ext.lnbs.get(nbn).getln().getLastId();
        cmdHdlNoteEditor({ nb: nbn, nId: lid });
    }
    ExtCmds.cmdHdlNoteAdd = cmdHdlNoteAdd;
    async function cmdHdlDomainGlsEdit(params) {
        if (extensionVariables_1.ext.lnbs.editor.trySetEditor('domaingls')) {
            vscode_1.window.showWarningMessage('Please process the editor first.');
        }
        else {
            extensionVariables_1.ext.lnbs.createDomainGlsEditor(params.dn);
        }
        vscode_1.commands.executeCommand('editExplorer.openFileResource', vscode_1.Uri.file(extensionVariables_1.ext.lnbs.editor.getEditorFile()));
    }
    ExtCmds.cmdHdlDomainGlsEdit = cmdHdlDomainGlsEdit;
    async function cmdHdlCategoryNoteAdd(params) {
        cmdHdlNoteAdd(params.als);
    }
    ExtCmds.cmdHdlCategoryNoteAdd = cmdHdlCategoryNoteAdd;
    async function cmdHdlNotesGroupLabelsEdit(params) {
        if (extensionVariables_1.ext.lnbs.editor.trySetEditor('notesgls')) {
            vscode_1.window.showWarningMessage('Please process the editor first.');
        }
        else {
            extensionVariables_1.ext.lnbs.createNotesGroupLabelsEditor(params.als);
        }
        vscode_1.commands.executeCommand('editExplorer.openFileResource', vscode_1.Uri.file(extensionVariables_1.ext.lnbs.editor.getEditorFile()));
    }
    ExtCmds.cmdHdlNotesGroupLabelsEdit = cmdHdlNotesGroupLabelsEdit;
    async function cmdHdlNoteRemove(params) {
        if (await vscode_1.window.showQuickPick(['Yes', 'No'], { title: `Confirm delete nb:${params.nb}, id:${params.id}.`, placeHolder: `Confirm delete nb:${params.nb}, id:${params.id}.` }) === "Yes") {
            extensionVariables_1.ext.lnbs.get(params.nb).getln().delete(params.id);
            extensionVariables_1.ext.lwebPanelView.refresh();
        }
    }
    ExtCmds.cmdHdlNoteRemove = cmdHdlNoteRemove;
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
})(ExtCmds = exports.ExtCmds || (exports.ExtCmds = {}));
//# sourceMappingURL=extensionCommands.js.map