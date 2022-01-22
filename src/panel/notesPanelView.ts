import * as path from 'path';
import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ToWebView as twv } from './notesMessage';
import { ExtCmds } from '../extensionCommands';

export class NotesPanelView {
    private panel: vscode.WebviewPanel | undefined = undefined;
    private viewData: twv.WVDomain | undefined;
    private dpathCache: string[] = [];

    private assetsFile = (name: string) => {
        const file = path.join(ext.context.extensionPath, 'out', name);
        return vscode.Uri.file(file).with({ scheme: 'vscode-resource' }).toString();
    };

    // const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
    private getWebviewContent() {
        const stylesPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'main.css');
        console.log(stylesPathMainPath.fsPath);
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
                    case 'edit-contentFile':
                        ExtCmds.cmdHdlNoteEditColContent(msg.data.id, msg.data.n);
                        break;
                    case 'edit-col':
                        vscode.commands.executeCommand('vscode-note.note.edit.col', msg.data.id, msg.data.cn);
                        break;
                    case 'edit-col-add':
                        vscode.commands.executeCommand('vscode-note.note.edit.col.add', msg.data.id);
                        break;
                    case 'edit-col-remove':
                        ExtCmds.cmdHdlNoteColRemove(msg.data.id, msg.data.cn);
                        break;
                    case 'doc':
                        vscode.commands.executeCommand('vscode-note.note.doc.show', msg.data);
                        break;
                    case 'edit-note-doc-files':
                        ExtCmds.cmdHdlNoteEditFilesCreate(msg.data.nId);
                        break;
                    case 'edit-note-doc-add':
                        ExtCmds.cmdHdlNoteEditDocCreate(msg.data.nId);
                        break;
                    case 'edit-note-category-rename':
                        ExtCmds.cmdHdlNoteEditCategoryRename(msg.data.nId);
                        break;
                    case 'edit-note-remove':
                        ExtCmds.cmdHdlNoteEditTrash(msg.data.nId);
                        break;
                    case 'edit-note-openfolder':
                        ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
                        break;
                    case 'add-category':
                        vscode.commands.executeCommand('vscode-note.category.add', false);
                        break;
                    // case 'edit-category':
                    // ExtCmds.cmdHdlCategoryEdit(msg.data.category);
                    // vscode.commands.executeCommand('vscode-note.category.edit', msg.data.category);
                    // break;
                    case 'col-to-terminal':
                        console.log('col-to-terminal', msg.data);
                        ExtCmds.cmdHdlNoteColToActiveTermianl(msg.data.id, msg.data.cidx);
                        break;
                    case 'col-to-terminal-args':
                        console.log('col-to-terminal', msg.data);
                        ExtCmds.cmdHdlNoteColToActiveTermianl(msg.data.id, msg.data.cidx);
                        break;
                }
            },
            undefined,
            ext.context.subscriptions
        );
        this.panel.webview.html = this.getWebviewContent();
    }

    public parseDomain(dpath?: string[]) {
        this.dpathCache = dpath || this.dpathCache;
        this.viewData = this.genViewData();
        return this;
    }

    public addCategory(name: string) {
        this.viewData!.categories.unshift({ name: name, notes: [] });
        return this;
    }

    private genViewData(): twv.WVDomain {
        const notes = ext.dbFS.dch.selectNotesUnderDomain(this.dpathCache);
        const sortNotes = ext.dbFS.sortNotes(notes);
        const categories: twv.WVCategory[] = [];
        for (const nId of sortNotes) {
            const cname = ext.dbFS.readNoteMeta(nId).category;
            const contents: string[] = ext.dbFS.selectNoteContents(nId);
            const isDoc = ext.dbFS.selectDocExist(nId);
            const isFiles = ext.dbFS.selectFilesExist(nId);

            if (categories.filter((c) => c.name === cname).length >= 1) {
                categories.filter((c) => c.name === cname)[0].notes.push({ nId, contents, doc: isDoc, files: isFiles });
            } else {
                categories.push({ name: cname, notes: [{ nId, contents, doc: isDoc, files: isFiles }] });
            }
        }
        return { dpath: this.dpathCache, categories: categories };
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
