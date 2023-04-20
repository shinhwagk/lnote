import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ExtCmds } from '../extensionCommands';
import { tools } from '../helper';
import { LNote } from '../database/note';
import { IWebNote } from './types';
import { INBNote } from '../types';

export class SearchPanelView {
    private panel: vscode.WebviewPanel | undefined = undefined;
    private keywords = new Set<string>();

    private getWebviewContent() {
        const stylesPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'main.css');
        const jsPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'search.js');
        const stylesMainUri = this.panel?.webview.asWebviewUri(stylesPathMainPath);
        const jsMainUrl = this.panel?.webview.asWebviewUri(jsPathMainPath);
        // const cspSource = this.panel?.webview.cspSource
        const nonce = tools.getNonce();
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

    async show(): Promise<void> {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            // await this.postData();
            return;
        }

        this.initPanel();
    }

    async refresh(): Promise<void> {
        const notes = ext.lnbs.search(Array.from(this.keywords));
        await this.postNotes(this.convertForWebStruct(notes));
    }

    private convertForWebStruct(notes: LNote[]): IWebNote[] {
        return notes
            .map(n => {
                const _n = n.getData()
                const isDoc = n.checkDocExist();
                const isFiles = n.checkFilesExist();
                const al = n.getDataArrayLabels();
                return {
                    nb: n.getnb(),
                    nid: n.getId(),
                    doc: isDoc,
                    files: isFiles,
                    labels: al,
                    contents: _n.contents,
                    mts: _n.mts,
                    cts: _n.cts
                };
            });
    }

    private async postNotes(notes: IWebNote[]) {
        await this.panel!.webview.postMessage({
            command: 'post-notes',
            data: { notes: notes }
        });
    }

    private initPanel() {
        this.panel = vscode.window.createWebviewPanel(
            'lnote',
            'lnote search',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(ext.context.extensionUri, 'out')
                ],
                retainContextWhenHidden: true
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
        this.panel.webview.onDidReceiveMessage(
            async (msg) => {
                switch (msg.command) {
                    case 'search':
                        this.keywords.clear();
                        (msg.data.keywords as string[]).forEach(x => this.keywords.add(x));
                        const notes = ext.lnbs.search(msg.data.keywords);
                        await this.postNotes(this.convertForWebStruct(notes));
                        break;
                    case 'note-edit':
                        ExtCmds.cmdHdlNoteEditor(msg.params);
                        break;
                    case 'note-add':
                        ExtCmds.cmdHdlNoteAdd(msg.params);
                        break;
                    case 'note-doc-show':
                        ExtCmds.cmdHdlNoteDocShow(msg.params);
                        break;
                    case 'note-files-open':
                        ExtCmds.cmdHdlNoteFilesOpen(msg.params);
                        break;
                    case 'note-files-create':
                        ExtCmds.cmdHdlNoteFilesCreate(msg.params);
                        break;
                    case 'note-doc-create':
                        ExtCmds.cmdHdlNBNoteDocCreate(msg.params);
                        break;
                    case 'edit-note-openfolder':
                        ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
                        break;
                }
            },
            undefined,
            ext.context.subscriptions
        );
        this.panel.webview.html = this.getWebviewContent();
    }
}
