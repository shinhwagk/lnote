import * as path from 'path';

import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ToWebView as twv } from './notesMessage';
import { ExtCmds } from '../extensionCommands';

export class NotesPanelView {
    private panel: vscode.WebviewPanel | undefined = undefined;
    private viewData: twv.WVDomain | undefined;
    private domainNode: string[] = [];

    private assetsFile = (name: string) => {
        const file = path.join(ext.context.extensionPath, 'out', name);
        return vscode.Uri.file(file).with({ scheme: 'vscode-resource' }).toString();
    };

    // const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
    private getWebviewContent() {
        const stylesPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'main.css');
        const stylesMainUri = this.panel?.webview.asWebviewUri(stylesPathMainPath);
        const nonce = getNonce();
        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${stylesMainUri}" rel="stylesheet">
				    <script nonce="${nonce}" src="https://kit.fontawesome.com/61b8139299.js" crossorigin="anonymous" ></script>
                    <title>vscode-note</title>
                </head>
                <body>
                    <div id="root">
                        <div id="content"></div>
                        <ul id="contextMenu" class="contextMenu"></ul>
                    </div>
                    <script>
                        const vscode = acquireVsCodeApi();
                        window.onload = function() {
                            vscode.postMessage({ command: 'get-data' });
                            console.log('Ready to accept data.');
                        };
                    </script>
                    <script nonce="${nonce}" src="${this.assetsFile('main.js')}"></script>
                </body>
                </html>`;
    }

    showNotesPlanView(): void {
        if (!this.panel) {
            this.initPanel();
        }

        this.panel!.webview.postMessage({ command: 'data', data: this.viewData });
        if (!this.panel!.visible) {
            this.panel!.reveal(vscode.ViewColumn.One);
        }
    }

    private initPanel() {
        this.panel = vscode.window.createWebviewPanel('vscode-note', 'vscode-note', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(ext.context.extensionUri, 'out')],
        });
        this.panel.iconPath = vscode.Uri.joinPath(ext.context.extensionUri, 'images/wv-icon.svg');
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
                console.log('vsnote webview closed.');
            },
            null,
            ext.context.subscriptions
        );
        this.panel.onDidChangeViewState(
            (e) => {
                const panel = e.webviewPanel;
                if (panel.visible) {
                    this.parseDomain();
                    this.showNotesPlanView();
                }
            },
            null,
            ext.context.subscriptions
        );
        this.panel.webview.onDidReceiveMessage(
            (msg) => {
                switch (msg.command) {
                    case 'get-data':
                        this.showNotesPlanView();
                        break;
                    case 'edit':
                        vscode.commands.executeCommand('vscode-note.note.edit', msg.data.id, msg.data.category);
                        break;
                    case 'note-add':
                        ExtCmds.cmdHdlNoteAdd(msg.data.category);
                        break;
                    case 'notebook-note-contents-edit':
                        ExtCmds.cmdHdlNoteEditNoteContents(msg.data.nId);
                        break;
                    case 'note-edit-short-document':
                        ExtCmds.cmdHdlNoteEditShortDocument(msg.data.id);
                        break;
                    // case 'edit-col-remove':
                    //     ExtCmds.cmdHdlNoteColRemove(msg.data.nId, msg.data.cIdx);
                    //     break;
                    case 'notebook-note-doc-show':
                        ExtCmds.cmdHdlNotebookNoteDocShow(msg.data.nId);
                        break;
                    case 'notebook-note-files-open':
                        ExtCmds.cmdHdlNoteFilesOpen(msg.data.nId);
                        break;
                    case 'notebook-note-files-create':
                        ExtCmds.cmdHdlNoteFilesCreate(msg.data.nId);
                        break;
                    case 'notebook-note-doc-create':
                        ExtCmds.cmdHdlNBNoteDocCreate(msg.data.nId);
                        break;
                    case 'edit-note-notebook-domain-category-rename':
                        ExtCmds.cmdHdlNoteCategoryRename(msg.data.nId);
                        break;
                    case 'notebook-domain-category-note-remove':
                        ExtCmds.cmdHdlNBDomainCategoryNoteRemove(msg.data.category, msg.data.nId);
                        break;
                    case 'edit-note-openfolder':
                        ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
                        break;
                    case 'category-add':
                        ExtCmds.cmdHdlDomainCategoryAdd(false);
                        break;
                    case 'notebook-domain-category-rename':
                        ExtCmds.cmdHdlNBDomainCategoryRename(msg.data.category);
                        break;
                    case 'notebook-domain-category-remove':
                        ExtCmds.cmdHdlNBDomainCategoryRemove(msg.data.category);
                        break;
                    case 'category-to-domain':
                        vscode.window.showInformationMessage('soon');
                        // ExtCmds.cmdHdlCategoryMoveToOtherDomain(msg.data.category);
                        break;
                    case 'col-to-terminal':
                        ExtCmds.cmdHdlNoteColToActiveTermianl(msg.data.id, msg.data.cidx);
                        break;
                    case 'col-to-terminal-args':
                        ExtCmds.cmdHdlNoteColToActiveTermianl(msg.data.id, msg.data.cidx);
                        break;
                    case 'domain-edit-labels':
                        ExtCmds.cmdHdlDomainEditLabels(msg.data);
                        break;
                    case 'note-edit-labels':
                        ExtCmds.cmdHdlNoteEditLabels(msg.data);
                        break;
                }
            },
            undefined,
            ext.context.subscriptions
        );
        this.panel.webview.html = this.getWebviewContent();
    }

    public parseDomain(domainNode?: string[]) {
        this.domainNode = domainNode || this.domainNode;
        this.viewData = this.genViewData();
        return this;
    }

    public addCategory(name: string) {
        this.viewData!.categories.unshift({ name: name, notes: [] });
        return this;
    }

    private genViewData(): any {
        const wvCategories: twv.WVCategory[] = [];
        const categoriesOfDomain = ext.notebookDatabase.getCategoriesOfDomain(this.domainNode)
        const notes = ext.notebookDatabase.getNBNotes(this.domainNode[0])
        for (const cname of Object.keys(categoriesOfDomain)) {
            if (wvCategories.filter((c) => c.name === cname).length === 0) {
                wvCategories.push({ name: cname, notes: [] });
            }
            for (const nId of categoriesOfDomain[cname]) {
                const isDoc = ext.notebookDatabase.checkDocExist(this.domainNode[0], nId)
                const isFiles = ext.notebookDatabase.checkFilesExist(this.domainNode[0], nId)
                const contents = notes[nId].contents
                const cDate = (new Date(notes[nId].cts)).toISOString()
                const mDate = (new Date(notes[nId].mts)).toISOString()
                if (wvCategories.filter((c) => c.name === cname).length >= 1) {
                    wvCategories.filter((c) => c.name === cname)[0].notes.push({ nId: nId, contents: contents, doc: isDoc, files: isFiles, cDate, mDate });
                }
            }
        }
        return { dpath: this.domainNode, categories: wvCategories };
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
