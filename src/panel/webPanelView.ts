import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ExtCmds } from '../extensionCommands';
import { tools } from '../helper';
import { LNote } from '../database/note';
import { DomainNodeSplit } from '../types';
import { IWebNote } from './types';



export class LWebPanelView {
    private panel: vscode.WebviewPanel | undefined = undefined;
    private keywords = new Set<string>();
    private webKind: 'domain' | 'search' = 'domain';
    // only for domain web
    private dns: DomainNodeSplit = [];

    public setdn(dn: string[]) {
        this.dns = dn;
        return this;
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

    async show(webKind: 'domain' | 'search'): Promise<void> {
        if (this.panel === undefined) {
            this.initPanel();
        }
        this.panel!.title = `lnote ${webKind}`;

        if (this.webKind !== webKind) {
            await this.panel!.webview.postMessage({ command: 'kind', data: { wk: webKind } });
            this.webKind = webKind;
        } else if (this.webKind === 'domain') {
            await this.postDomain();
        }

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

    private async postSerach() {
        const notes = ext.lnbs.search(Array.from(this.keywords));
        await this.panel!.webview.postMessage({
            command: 'post-search',
            data: { notes: this.convertForWebStruct(notes) }
        });
    }

    private async postDomain() {
        const d = ext.lnbs.get(this.dns[0]);
        const dals = d.getld().getArrayLabels(this.dns);
        const notes = d.getNotesOfDomain(this.dns);
        await this.panel!.webview.postMessage({
            command: 'post-domain',
            data: { dn: this.dns, dals: dals, notes: this.convertForWebStruct(notes) }
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
                        await this.panel!.webview.postMessage({ command: 'kind', data: { wk: this.webKind } });
                        break;
                    case 'search':
                        this.keywords.clear();
                        (msg.params.keywords as string[]).forEach(kw => this.keywords.add(kw));
                        console.log(this.keywords);
                        this.postSerach();
                        break;
                    case 'get-domain':
                        this.postDomain();
                        break;
                    case 'note-edit':
                        ExtCmds.cmdHdlNoteEditor(msg.params);
                        break;
                    case 'note-remove':
                        console.log("asdfdf", msg.params);
                        ExtCmds.cmdHdlNoteRemove(msg.params);
                        break;
                    case 'common-notes-note-add':
                        ExtCmds.cmdHdlNoteAdd(msg.params);
                        break;
                    case 'common-notes-labels-edit':
                        ExtCmds.cmdHdlNotesGroupLabelsEdit(msg.params);
                        break;
                    case 'domain-note-add':
                        ExtCmds.cmdHdlDomainNoteAdd(msg.params);
                        break;
                    case 'domain-labels-edit':
                        ExtCmds.cmdHdlDomainGlsEdit(msg.params);
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
                    // case 'edit-note-openfolder':
                    //     ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
                    //     break;
                }
            },
            undefined,
            ext.context.subscriptions
        );
        this.panel.webview.html = this.getWebviewContent();
    }
}
