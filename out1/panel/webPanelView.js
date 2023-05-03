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
exports.LWebPanelView = void 0;
const vscode = __importStar(require("vscode"));
const extensionVariables_1 = require("../extensionVariables");
const extensionCommands_1 = require("../extensionCommands");
const helper_1 = require("../helper");
class LWebPanelView {
    panel = undefined;
    webKind = 'domain';
    // only for search web 
    keywords = new Set();
    // only for domain web
    dns = [];
    setdn(dn) {
        this.dns = dn;
        return this;
    }
    getWebviewContent() {
        const stylesPathMainPath = vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'out', 'main.css');
        const jsPathMainPath = vscode.Uri.joinPath(extensionVariables_1.ext.context.extensionUri, 'out', `main.js`);
        const stylesMainUri = this.panel?.webview.asWebviewUri(stylesPathMainPath);
        const jsMainUrl = this.panel?.webview.asWebviewUri(jsPathMainPath);
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
                    <div id="root"></div>
                    <script>
                        const vscode = acquireVsCodeApi();
                    </script>
                    <script nonce="${nonce}" src="${jsMainUrl}"></script>
                </body>
                </html>`;
    }
    async show(webKind) {
        if (this.panel === undefined) {
            this.webKind = webKind;
            this.initPanel();
        }
        this.panel.title = `lnote ${webKind}`;
        if (this.webKind !== webKind) {
            await this.panel.webview.postMessage({ command: 'kind', data: { wk: webKind } });
            this.webKind = webKind;
        }
        else if (this.webKind === 'domain') {
            await this.postDomain();
        }
    }
    visible() {
        return this.panel?.visible;
    }
    async dispose() {
        await this.panel?.dispose();
    }
    async refresh() {
        if (this.webKind === 'domain') {
            await this.postDomain();
        }
        else if (this.webKind === 'search') {
            await this.postSerach();
        }
    }
    convertForWebStruct(notes) {
        return notes
            .map(n => {
            const isDoc = n.checkDocExist();
            const isFiles = n.checkFilesExist();
            const als = n.getAls();
            return {
                nb: n.nb,
                id: n.id,
                doc: isDoc,
                files: isFiles,
                als: als,
                contents: n.contents,
                mts: n.mts,
                cts: n.cts
            };
        });
    }
    async postSerach() {
        const notes = extensionVariables_1.ext.lnbs.search(Array.from(this.keywords));
        await this.panel.webview.postMessage({
            command: 'post-search',
            data: { notes: this.convertForWebStruct(notes) }
        });
    }
    async postDomain() {
        const d = extensionVariables_1.ext.lnbs.get(this.dns[0]);
        const dals = d.getld().getArrayLabels(this.dns);
        const notes = d.getNotesOfDomain(this.dns);
        await this.panel.webview.postMessage({
            command: 'post-domain',
            data: { dn: this.dns, dals: dals, notes: this.convertForWebStruct(notes) }
        });
    }
    initPanel() {
        this.panel = vscode.window.createWebviewPanel('lnote', `lnote ${this.webKind}`, vscode.ViewColumn.Active, {
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
                case 'get-kind':
                    await this.panel.webview.postMessage({ command: 'kind', data: { wk: this.webKind } });
                    break;
                case 'get-search':
                    this.keywords.clear();
                    msg.params.keywords.forEach(kw => this.keywords.add(kw));
                    await this.postSerach();
                    this.keywords.clear();
                    break;
                case 'get-domain':
                    this.postDomain();
                    break;
                case 'note-edit':
                    extensionCommands_1.ExtCmds.cmdHdlNoteEditor(msg.params);
                    break;
                case 'note-remove':
                    extensionCommands_1.ExtCmds.cmdHdlNoteRemove(msg.params);
                    break;
                case 'common-notes-note-add':
                    const ps = msg.params;
                    extensionCommands_1.ExtCmds.cmdHdlNoteAdd(ps.als);
                    break;
                case 'common-notes-labels-edit':
                    extensionCommands_1.ExtCmds.cmdHdlNotesGroupLabelsEdit(msg.params);
                    break;
                case 'domain-labels-edit':
                    extensionCommands_1.ExtCmds.cmdHdlDomainGlsEdit(msg.params);
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
            }
        }, undefined, extensionVariables_1.ext.context.subscriptions);
        this.panel.webview.html = this.getWebviewContent();
    }
}
exports.LWebPanelView = LWebPanelView;
//# sourceMappingURL=webPanelView.js.map