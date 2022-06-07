import * as path from 'path';

import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ToWebView as twv } from './notesMessage';
import { ExtCmds } from '../extensionCommands';
import { existsSync } from 'fs-extra';
import { readFileSync } from 'fs';
import { columnSplit, pathSplit } from '../constants';

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
                    case 'note-create':
                        ExtCmds.cmdHdlNoteCreate(msg.data.category);
                        break;
                    case 'edit-notes':
                        ExtCmds.cmdHdlNoteEditColContent(msg.data.nId);
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

    public parseDomain(dpath?: string[]) {
        this.dpathCache = dpath || this.dpathCache;
        this.viewData = this.genViewData();
        return this;
    }

    public addCategory(name: string) {
        this.viewData!.categories.unshift({ name: name, notes: [] });
        return this;
    }

    private genViewData(): any {
        console.log(this.dpathCache);
        const categories: twv.WVCategory[] = [];
        const meta = ext.domainDB.getDomainMeta(this.dpathCache);
        for (const cname of Object.keys(meta)) {
            for (const note of Array.from(new Set<string>(meta[cname]))) {
                console.log(`/workspaces/vscode-note/notes-usage/${this.dpathCache.join(pathSplit)}/${note}.txt`);
                if (existsSync(`/workspaces/vscode-note/notes-usage/${this.dpathCache.join(pathSplit)}/${note}.txt`)) {
                    const contents = readFileSync(
                        `/workspaces/vscode-note/notes-usage/${this.dpathCache.join(pathSplit)}/${note}.txt`,
                        'utf8'
                    ).split(columnSplit);
                    const isDoc = existsSync(
                        `/workspaces/vscode-note/notes-usage/${this.dpathCache.join(pathSplit)}/${note}_doc`
                    );
                    const isFiles = existsSync(
                        `/workspaces/vscode-note/notes-usage/${this.dpathCache.join(pathSplit)}/${note}_files`
                    );
                    if (categories.filter((c) => c.name === cname).length >= 1) {
                        categories
                            .filter((c) => c.name === cname)[0]
                            .notes.push({ nId: note, contents, doc: isDoc, files: isFiles });
                    } else {
                        categories.push({ name: cname, notes: [{ nId: note, contents, doc: isDoc, files: isFiles }] });
                    }
                    // categories.push({ name: cname, notes: [{ nId: note, contents, doc: isDoc, files: isFiles }] });
                }
            }
        }
        // const sortNotes = ext.domainDB.getDomainNotes(this.dpathCache);
        // // const sortNotes = ext.domainDB.sortNotes(notes);

        // for (const nId of sortNotes) {
        //     const cname = ext.domainDB.noteDB.getMeta(nId).category;
        //     const contents: string[] = ext.domainDB.noteDB.getNoteContents(nId);
        //     const isDoc = ext.domainDB.noteDB.checkDocExist(nId);
        //     const isFiles = ext.domainDB.noteDB.checkFilesExist(nId);
        //     if (categories.filter((c) => c.name === cname).length >= 1) {
        //         categories.filter((c) => c.name === cname)[0].notes.push({ nId, contents, doc: isDoc, files: isFiles });
        //     } else {
        //         categories.push({ name: cname, notes: [{ nId, contents, doc: isDoc, files: isFiles }] });
        //     }
        // }
        return { dpath: this.dpathCache, categories: categories };
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
