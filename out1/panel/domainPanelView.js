"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainPanelView = void 0;
const vscode = __importStar(require("vscode"));
const extensionVariables_1 = require("../extensionVariables");
const extensionCommands_1 = require("../extensionCommands");
const helper_1 = require("../helper");
class DomainPanelView {
    panel = undefined;
    getWebviewContent() {
        const stylesPathMainPath = vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'out', 'main.css');
        const jsPathMainPath = vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'out', 'main.js');
        const stylesMainUri = this.panel?.webview.asWebviewUri(stylesPathMainPath);
        const jsMainUrl = this.panel?.webview.asWebviewUri(jsPathMainPath);
        // const cspSource = this.panel?.webview.cspSource
        const nonce = helper_1.tools.getNonce();
        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${stylesMainUri}" rel="stylesheet">
                    <script nonce="${nonce}" src="https://kit.fontawesome.com/61b8139299.js" crossorigin="anonymous" ></script>
                    <title>lnote</title>
                </head>
                <body>
                    <div id="root">
                        <div id="content"></div>
                        <ul id="contextMenu" class="contextMenu"></ul>
                    </div>
                    <script>
                        const vscode = acquireVsCodeApi();
                    </script>
                    <script nonce="${nonce}" src="${jsMainUrl}"></script>
                </body>
                </html>`;
    }
    async show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            // await this.postData();
            return;
        }
        this.initPanel();
    }
    convertForWebStruct(notes) {
        return notes
            .map(n => {
            const isDoc = n.checkDocExist();
            const isFiles = n.checkFilesExist();
            const _n = JSON.parse(JSON.stringify(n)); // clone obj
            const alOfNote = n.getDataArrayLabels(); //.concat(ext.gs.nbName);
            _n['labels'] = alOfNote;
            return { nb: n.getnb(), nId: n.getId(), doc: isDoc, files: isFiles, labels: alOfNote, ..._n };
        });
    }
    async postNotes(notes) {
        await this.panel.webview.postMessage({
            command: 'post-notes',
            data: { notes: notes }
        });
    }
    initPanel() {
        this.panel = vscode.window.createWebviewPanel('lnote', 'lnote', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'out')],
            retainContextWhenHidden: true
        });
        this.panel.iconPath = vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'images/wv-icon.svg');
        this.panel.onDidDispose(() => {
            this.panel = undefined;
            console.log('vsnote webview closed.');
        }, null, extensionVariables_1.ext.context.subscriptions);
        this.panel.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'get-data':
                    const notes = extensionVariables_1.ext.lnbs.get(extensionVariables_1.ext.gs.domainNode[0]).getNotes(extensionVariables_1.ext.gs.domainNode);
                    await this.postNotes(this.convertForWebStruct(notes));
                    break;
                case 'web-update-labels':
                    // await this.postData();
                    break;
                case 'notebook-editor':
                    extensionCommands_1.ExtCmds.cmdHdlNoteEditor(msg.data.params);
                    break;
                case 'notebook-note-doc-show':
                    extensionCommands_1.ExtCmds.cmdHdlNoteDocShow(msg.data.nId);
                    break;
                case 'notebook-note-files-open':
                    extensionCommands_1.ExtCmds.cmdHdlNoteFilesOpen(msg.data.nId);
                    break;
                case 'notebook-note-files-create':
                    extensionCommands_1.ExtCmds.cmdHdlNoteFilesCreate(msg.data.nId);
                    break;
                case 'notebook-note-doc-create':
                    extensionCommands_1.ExtCmds.cmdHdlNBNoteDocCreate(msg.data.nId);
                    break;
                case 'edit-note-openfolder':
                    extensionCommands_1.ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
                    break;
            }
        }, undefined, extensionVariables_1.ext.context.subscriptions);
        this.panel.webview.html = this.getWebviewContent();
    }
}
exports.DomainPanelView = DomainPanelView;
//# sourceMappingURL=domainPanelView.js.map