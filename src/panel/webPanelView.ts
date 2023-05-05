import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ExtCmds } from '../extensionCommands';
import { tools } from '../helper';
import { LNote } from '../database/note';
import { DomainNodeSplit } from '../types';
import { IWebNote } from '../types';



export class LWebPanelView {
    private panel: vscode.WebviewPanel | undefined = undefined;
    private webKind: 'domain' | 'search' = 'domain';

    // only for search web 
    private keywords = new Set<string>();

    // only for domain web
    private arrayLabels = new Set<string>();

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

    setwk(webKind: 'domain' | 'search') {
        if (this.webKind !== webKind) {
            this.webKind = webKind;
        }
        return this;
    }

    async show(): Promise<void> {
        if (this.panel === undefined) {
            this.initPanel();
        } else {
            this.panel!.title = `lnote ${this.webKind}`;
            this.panel!.webview.postMessage({ command: 'init-frame-doms', data: { wk: this.webKind } });
        }
    }

    visible() {
        return this.panel?.visible;
    }

    async dispose() {
        await this.panel?.dispose();
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
            data: {
                notes: this.convertForWebStruct(notes)
            }
        });
    }

    private async postDomain() {
        const d = ext.glnbs().get(this.dns[0]);
        const dals = d.getld().getArrayLabels(this.dns);
        const notes = d.getNotesOfDomain(this.dns);
        await this.panel!.webview.postMessage({
            command: 'post-domain',
            data: {
                dn: this.dns,
                dals: dals,
                notes: this.convertForWebStruct(notes)
            }
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
                    case 'web-ready':
                        await this.show();
                        break;
                    case 'web-init-ready':
                        if (this.webKind === 'domain') {
                            await this.postDomain();
                        }
                        break;
                    case 'get-kind':
                        await this.panel!.webview.postMessage({ command: 'kind', data: { wk: this.webKind } });
                        break;
                    case 'get-search':
                        // this.keywords.clear();
                        (msg.params.keywords as string[]).forEach(kw => this.keywords.add(kw));
                        await this.postSerach();
                        // this.keywords.clear();
                        break;
                    case 'note-edit':
                        ExtCmds.cmdHdlNoteEditor(msg.params);
                        break;
                    case 'note-remove':
                        ExtCmds.cmdHdlNoteRemove(msg.params);
                        break;
                    case 'common-notes-note-add':
                        const ps: { als: string[] } = msg.params;
                        ExtCmds.cmdHdlNoteAdd(ps.als);
                        break;
                    case 'common-notes-labels-edit':
                        ExtCmds.cmdHdlNotesGroupLabelsEdit(msg.params);
                        break;
                    case 'domain-labels-edit':
                        ExtCmds.cmdHdlDomainGlsEdit(msg.params);
                        break;
                    case 'domain-refresh':
                        await this.refresh();
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
                }
            },
            undefined,
            ext.context.subscriptions
        );
        this.panel.webview.html = this.getWebviewContent();
    }
}
