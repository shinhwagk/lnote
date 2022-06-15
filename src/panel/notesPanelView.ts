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
                    case 'edit-notes':
                        ExtCmds.cmdHdlNoteEditContent();
                        break;
                    case 'edit-col-add':
                        ExtCmds.cmdHdlNoteColAdd(msg.data.id);
                        break;
                    case 'edit-col-remove':
                        ExtCmds.cmdHdlNoteColRemove(msg.data.nId, msg.data.cIdx);
                        break;
                    case 'doc':
                        ExtCmds.cmdHdlNoteDocShow(msg.data);
                        break;
                    case 'note-files-open':
                        ExtCmds.cmdHdlNoteFilesOpen(msg.data);
                        break;
                    case 'edit-note-doc-files':
                        ExtCmds.cmdHdlNoteFilesCreate(msg.data.nId);
                        break;
                    case 'edit-note-doc-add':
                        ExtCmds.cmdHdlNoteDocCreate(msg.data.nId);
                        break;
                    case 'edit-note-category-rename':
                        ExtCmds.cmdHdlNoteCategoryRename(msg.data.nId);
                        break;
                    case 'note-remove':
                        ExtCmds.cmdHdlNoteRemove(msg.data.nId);
                        break;
                    case 'edit-note-openfolder':
                        ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
                        break;
                    case 'category-add':
                        ExtCmds.cmdHdlCategoryAdd(false);
                        break;
                    case 'category-rename':
                        ExtCmds.cmdHdlCategoryRename(msg.data.category);
                        break;
                    case 'category-remove':
                        ExtCmds.cmdHdlCategoryRemove(msg.data.category);
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
        const categories: twv.WVCategory[] = [];
        const domainNotes = ext.domainDB.getNotes(this.domainNode)
        for (const category of Object.keys(domainNotes)) {
            for (const note of domainNotes[category]) {
                const isDoc = ext.domainDB.checkDocExist(this.domainNode, note.id)
                const isFiles = ext.domainDB.checkFilesExist(this.domainNode, note.id)
                if (categories.filter((c) => c.name === category).length >= 1) {
                    categories.filter((c) => c.name === category)[0].notes.push({ nId: note.id, contents: note.contents, doc: isDoc, files: isFiles });
                } else {
                    categories.push({ name: category, notes: [{ nId: note.id, contents: note.contents, doc: isDoc, files: isFiles }] });
                }
            }
            // categories.push({ name: category, notes: [{ nId: note, contents, doc: isDoc, files: isFiles }] });
        }
        // const sortNotes = ext.domainDB.getDomainNotes(this.dpathCache);
        // // const sortNotes = ext.domainDB.sortNotes(notes);

        // for (const nId of sortNotes) {
        //     const category = ext.domainDB.noteDB.getMeta(nId).category;
        //     const contents: string[] = ext.domainDB.noteDB.getNoteContents(nId);
        //     const isDoc = ext.domainDB.noteDB.checkDocExist(nId);
        //     const isFiles = ext.domainDB.noteDB.checkFilesExist(nId);
        //     if (categories.filter((c) => c.name === category).length >= 1) {
        //         categories.filter((c) => c.name === category)[0].notes.push({ nId, contents, doc: isDoc, files: isFiles });
        //     } else {
        //         categories.push({ name: category, notes: [{ nId, contents, doc: isDoc, files: isFiles }] });
        //     }
        // }
        return { dpath: this.domainNode, categories: categories };
        // return { dpath: [], categories: [] };
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
