import * as path from 'path';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { ToWebView as twv } from './notesMessage';
import { tools } from '../helper';

export class NotesPanelView {
    private panel: vscode.WebviewPanel | undefined = undefined;
    private viewData: twv.WVDomain | undefined;
    private dpathCache: string[] = [];

    private assetsFile = (name: string) => {
        const file = path.join(ext.context.extensionPath, 'out', name);
        return vscode.Uri.file(file)
            .with({ scheme: 'vscode-resource' })
            .toString();
    };

    private getWebviewContent() {
        return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>vscode-note</title>
                </head>
                <body>
                    <div id="root"></div>
                    <script src="${this.assetsFile('react.production.min.js')}"></script>
                    <script src="${this.assetsFile('react-dom.production.min.js')}"></script>
                    <script>
                        const vscode = acquireVsCodeApi();
                        window.onload = function() {
                            vscode.postMessage({ command: 'get-data' });
                            console.log('Ready to accept data.');
                        };
                    </script>
                    <script src="${this.assetsFile('main.wv.js')}"></script>
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
            localResourceRoots: [vscode.Uri.file(path.join(ext.context.extensionPath, 'out'))]
        });
        this.panel.iconPath = vscode.Uri.file(path.join(ext.context.extensionPath, 'images/wv-icon.svg'));
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
                console.log('vsnote webview closed.');
            },
            null,
            ext.context.subscriptions
        );
        this.panel.onDidChangeViewState(
            e => {
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
            msg => {
                switch (msg.command) {
                    case 'get-data':
                        this.showNotesPlanView();
                        break;
                    case 'edit':
                        vscode.commands.executeCommand('vscode-note.note.edit', msg.data.id, msg.data.category);
                        break;
                    case 'edit-contentFile':
                        vscode.commands.executeCommand('vscode-note.note.edit.col.content', msg.data.id, msg.data.n);
                        break;
                    case 'edit-col':
                        vscode.commands.executeCommand('vscode-note.note.edit.col', msg.data.id, msg.data.cn);
                        break;
                    case 'doc':
                        vscode.commands.executeCommand('vscode-note.note.doc.show', msg.data);
                        break;
                    case 'files':
                        vscode.commands.executeCommand('vscode-note.note.files.open', msg.data);
                        break;
                    case 'add':
                        vscode.commands.executeCommand('vscode-note.note.add', msg.data);
                        break;
                    case 'add-category':
                        vscode.commands.executeCommand('vscode-note.category.add', false);
                        break;
                    case 'edit-category':
                        vscode.commands.executeCommand('vscode-note.category.edit', msg.data.category);
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
        const sortNotes = ext.dbFS.sortNotes(this.dpathCache, ...notes);
        const categories: twv.WVCategory[] = [];
        for (const nId of sortNotes) {
            const cname = ext.dbFS.readNoteMeta(nId).tags.filter(tag => tools.stringArrayEqual(tag.domain, this.dpathCache))[0]
                .category;
            const contents: string[] = ext.dbFS.selectNoteContents(nId);
            const isDoc = ext.dbFS.selectDocExist(nId);
            const isFiles = ext.dbFS.selectFilesExist(nId);

            if (categories.filter(c => c.name === cname).length >= 1) {
                categories.filter(c => c.name === cname)[0].notes.push({ nId, contents, doc: isDoc, files: isFiles });
            } else {
                categories.push({ name: cname, notes: [{ nId, contents, doc: isDoc, files: isFiles }] });
            }
        }
        return { dpath: this.dpathCache, categories: categories };
    }
}
