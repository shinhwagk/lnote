import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ExtCmds } from '../extensionCommands';
import { tools } from '../helper';
import { LNote } from '../database/note';
import { IWebNote } from './types';

export class LWebPanelView {
    private panel: vscode.WebviewPanel | undefined = undefined;
    private keywords = new Set<string>();
    private webKind: 'domain' | 'search' = 'domain';
    // only for domain web
    private domainNode: string[] = [];

    public setKind(kind: 'domain' | 'search') {
        if (kind !== this.webKind) {
            // this.panel?.webview.postMessage({ command: 'refresh', params: { webKind: kind } });
            // this.panel?.dispose();
        }
        this.webKind = kind;
        return this;
    }

    public setDomainNode(dn: string[]) {
        this.setKind('domain');
        this.domainNode = dn;
        return this;
    }

    public getKind() {
        return this.webKind;
    }

    private getWebviewContent() {
        const stylesPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'main.css');
        const jsPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', `main.js`);
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
                    <div id="root"></div>
                    <script>
                        const vscode = acquireVsCodeApi();
                    </script>
                    <script nonce="${nonce}" src="${jsMainUrl}"></script>
                </body>
                </html>`;
    }

    async show(): Promise<void> {
        console.log("panel", this.panel);
        if (this.panel === undefined) {
            this.initPanel();
        }
        // this.panel!.webview.html = this.getWebviewContent();
        this.panel!.title = `lnote ${this.webKind}`;
        await this.panel!.webview.postMessage({ command: 'kind', data: { webKind: this.webKind } });
        // 
    }

    async refresh(): Promise<void> {
        if (this.webKind === 'domain') {
            await this.postDomain();
        } else if (this.webKind === 'search') {
            await this.postSerach();
        }
    }

    private convertForWebStruct(notes: LNote[]): IWebNote[] {
        return notes
            .map(n => {
                const _n = n.getData();
                const isDoc = n.checkDocExist();
                const isFiles = n.checkFilesExist();
                const al = n.getDataArrayLabels();
                return {
                    nb: n.getnb(),
                    id: n.getId(),
                    doc: isDoc,
                    files: isFiles,
                    labels: al,
                    contents: _n.contents,
                    mts: _n.mts,
                    cts: _n.cts
                };
            });
    }

    private async postSerach() {
        const notes = ext.lnbs.search(Array.from(this.keywords));
        await this.panel!.webview.postMessage({
            command: 'post-search',
            data: { notes: this.convertForWebStruct(notes) }
        });
    }

    private async postDomain() {
        const notes = ext.lnbs.get(this.domainNode[0]).getNotes(this.domainNode);
        await this.panel!.webview.postMessage({
            command: 'post-domain',
            data: { dn: this.domainNode, notes: this.convertForWebStruct(notes) }
        });
    }

    private initPanel() {
        this.panel = vscode.window.createWebviewPanel(
            'lnote',
            `lnote ${this.webKind}`,
            vscode.ViewColumn.Active,
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
                    case 'get-kind':
                        await this.panel!.webview.postMessage({ command: 'kind', data: { webKind: this.webKind } });
                        break;
                    case 'search':
                        this.keywords.clear();
                        (msg.params.keywords as string[]).forEach(kw => this.keywords.add(kw));
                        console.log(this.keywords);
                        this.postSerach();
                        break;
                    case 'domain':
                        this.postDomain();
                        break;
                    case 'note-edit':
                        ExtCmds.cmdHdlNoteEditor(msg.params);
                        break;
                    case 'note-add':
                        ExtCmds.cmdHdlNoteAdd(msg.params);
                        break;
                    case 'domain-note-add':
                        ExtCmds.cmdHdlDomainNoteAdd(msg.params);
                        break;
                    case 'category-note-add':
                        ExtCmds.cmdHdlDomainNoteAdd(msg.params);
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
