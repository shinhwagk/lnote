"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeExtensionVariables = exports.listenVscodeWindowChange = exports.listenEditorFileSave = exports.listenEditorFileClose = exports.listenConfiguration = exports.ext = exports.GlobalState = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const vscode_1 = require("vscode");
const constants_1 = require("./constants");
const notebooks_1 = require("./database/notebooks");
const domainExplorer_1 = require("./explorer/domainExplorer");
const filesExplorer_1 = require("./explorer/filesExplorer");
const helper_1 = require("./helper");
const webPanelView_1 = require("./panel/webPanelView");
// import { WebStatus } from './panel/web';
class GlobalState {
    id = '';
    nb; //notebook name
    lnb;
    update(nb) {
        this.nb = nb;
        this.lnb = ext.lnbs.get(nb);
    }
}
exports.GlobalState = GlobalState;
var ext;
(function (ext) {
    ext.gs = new GlobalState();
    ext.setContext = (ctx, value) => vscode_1.commands.executeCommand('setContext', ctx, value);
    ext.registerCommand = (command, callback, thisArg) => ext.context.subscriptions.push(vscode_1.commands.registerCommand(command, callback, thisArg));
    ext.windowId = (new Date()).getTime().toString();
    // export const webState = new WebStatus();
    // export const editNotes = new Map<string, string[]>();
})(ext = exports.ext || (exports.ext = {}));
// function getShortcutsFilePath() {
//     return path.join(ext.masterPath, 'shortcuts.json');
// }
function listenConfiguration(ctx) {
    ctx.subscriptions.push(vscode_1.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration(constants_1.section)) {
            const notespath = vscode_1.workspace.getConfiguration(constants_1.section).get('notespath');
            if (notespath === undefined || notespath === '') {
                vscode_1.window.showInformationMessage('configuretion "notespath" wrong.');
                return;
            }
            ext.notespath = notespath;
            ext.lnbs = new notebooks_1.LNotebooks(ext.notespath);
            initializeExtensionVariables(ctx);
            ext.domainProvider.refresh();
        }
    }));
}
exports.listenConfiguration = listenConfiguration;
function listenEditorFileClose(ctx) {
    ctx.subscriptions.push(vscode_1.workspace.onDidCloseTextDocument((e) => {
        if (ext.lnbs
            && e.fileName === ext.lnbs.editor.getEditorFile()
            && ext.lnbs.editor.checkEditorFile()) {
            ext.lnbs.editor.archiveEditor();
        }
    }));
}
exports.listenEditorFileClose = listenEditorFileClose;
function listenEditorFileSave(ctx) {
    ctx.subscriptions.push(vscode_1.workspace.onDidSaveTextDocument((e) => {
        if (ext.lnbs
            && e.fileName === ext.lnbs.editor.getEditorFile()
            && ext.lnbs.editor.checkEditorFile()) {
            try {
                ext.lnbs.processEditor();
            }
            catch (e) {
                vscode_1.window.showErrorMessage(`${e}`);
                return;
            }
            ext.lwebPanelView.refresh();
        }
    }));
}
exports.listenEditorFileSave = listenEditorFileSave;
function listenVscodeWindowChange() {
    const vscodeWindowCheckFile = path_1.default.join(ext.notespath, 'windowid');
    if (!(0, fs_1.existsSync)(vscodeWindowCheckFile)) {
        helper_1.vfs.writeFileSync(vscodeWindowCheckFile, ext.windowId);
    }
    (0, fs_1.watchFile)(vscodeWindowCheckFile, () => {
        if (helper_1.vfs.readFileSync(vscodeWindowCheckFile) !== ext.windowId) {
            ext.windowId = (new Date()).getTime().toString();
            helper_1.vfs.writeFileSync(vscodeWindowCheckFile, ext.windowId);
            ext.lnbs.refresh();
        }
    });
}
exports.listenVscodeWindowChange = listenVscodeWindowChange;
function initializeExtensionVariables(ctx) {
    ext.context = ctx;
    const notespath = vscode_1.workspace.getConfiguration(constants_1.section).get('notespath');
    if (notespath === undefined || notespath === '') {
        return;
    }
    ext.notespath = notespath.endsWith('/') ? notespath : notespath + '/';
    ext.lnbs = new notebooks_1.LNotebooks(ext.notespath);
    // ext.gs = new GlobalState();
    if (!ext.lwebPanelView) {
        ext.lwebPanelView = new webPanelView_1.LWebPanelView();
    }
    if (!ext.domainProvider || !ext.domainTreeView) {
        ext.domainProvider = new domainExplorer_1.DomainExplorerProvider();
        ext.domainTreeView = vscode_1.window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
    }
    if (!ext.filesProvider) {
        ext.filesProvider = new filesExplorer_1.FilesExplorerProvider();
        vscode_1.window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
    }
    // if (!ext.domainProvider || !ext.domainTreeView) {
    //     ext.domainProvider = new DomainExplorerProvider(ext.domainDB);
    //     ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
    // }
    // if (!ext.filesProvider) {
    //     ext.filesProvider = new FilesExplorerProvider();
    //     window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
    // }
    // if (!ext.domainShortcutStatusBarItem) {
    //     ext.domainShortcutStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 1);
    //     ext.domainShortcutStatusBarItem.text = '$(list-unordered) Domains(Last)';
    //     ext.domainShortcutStatusBarItem.command = 'lnote.shortcuts.last';
    //     ext.domainShortcutStatusBarItem.show();
    //     ext.context.subscriptions.push(ext.domainShortcutStatusBarItem);
    // }
}
exports.initializeExtensionVariables = initializeExtensionVariables;
//# sourceMappingURL=extensionVariables.js.map