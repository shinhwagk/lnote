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
exports.SearchPanelView = void 0;
const vscode = __importStar(require("vscode"));
const extensionVariables_1 = require("../extensionVariables");
const extensionCommands_1 = require("../extensionCommands");
const helper_1 = require("../helper");
class SearchPanelView {
    panel = undefined;
    keywords = new Set();
    getWebviewContent() {
        const stylesPathMainPath = vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'out', 'main.css');
        const jsPathMainPath = vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'out', 'search.js');
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
                    <div class="search">
                        <textarea id="APjFqb" class="searchTextArea" maxlength="2048" name="q" rows="1" >@test default</textarea>
                        <button class="searchButton" onclick="myFunction()">button</button>
                        <a id="search-time"></a>
                    </div>
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
    async refresh() {
        const notes = extensionVariables_1.ext.lnbs.search(Array.from(this.keywords));
        await this.postNotes(this.convertForWebStruct(notes));
    }
    convertForWebStruct(notes) {
        return notes
            .map(n => {
            const _n = n.getData();
            const isDoc = n.checkDocExist();
            const isFiles = n.checkFilesExist();
            const al = n.getDataArrayLabels();
            return {
                nb: n.getnb(),
                nId: n.getId(),
                doc: isDoc,
                files: isFiles,
                labels: al,
                contents: _n.contents,
                mts: _n.mts,
                cts: _n.cts
            };
        });
    }
    async postNotes(notes) {
        await this.panel.webview.postMessage({
            command: 'post-notes',
            data: { notes: notes }
        });
    }
    initPanel() {
        this.panel = vscode.window.createWebviewPanel('lnote', 'lnote search', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'out')
            ],
            retainContextWhenHidden: true
        });
        this.panel.iconPath = vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'images/wv-icon.svg');
        this.panel.onDidDispose(() => {
            this.panel = undefined;
            console.log('vsnote webview closed.');
        }, null, extensionVariables_1.ext.context.subscriptions);
        this.panel.webview.onDidReceiveMessage(async (msg) => {
            switch (msg.command) {
                case 'search':
                    this.keywords.clear();
                    msg.data.keywords.forEach(x => this.keywords.add(x));
                    const notes = extensionVariables_1.ext.lnbs.search(msg.data.keywords);
                    await this.postNotes(this.convertForWebStruct(notes));
                    break;
                case 'note-edit':
                    extensionCommands_1.ExtCmds.cmdHdlNoteEditor(msg.params);
                    break;
                case 'note-doc-show':
                    extensionCommands_1.ExtCmds.cmdHdlNoteDocShow(msg.params);
                    break;
                case 'note-files-open':
                    extensionCommands_1.ExtCmds.cmdHdlNoteFilesOpen(msg.params);
                    break;
                case 'note-files-create':
                    extensionCommands_1.ExtCmds.cmdHdlNoteFilesCreate(msg.params);
                    break;
                case 'note-doc-create':
                    extensionCommands_1.ExtCmds.cmdHdlNBNoteDocCreate(msg.params);
                    break;
                case 'edit-note-openfolder':
                    extensionCommands_1.ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
                    break;
            }
        }, undefined, extensionVariables_1.ext.context.subscriptions);
        this.panel.webview.html = this.getWebviewContent();
    }
}
exports.SearchPanelView = SearchPanelView;
//# sourceMappingURL=searchPanelView.js.map