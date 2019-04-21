import * as path from 'path';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { ToWebView as twv } from './notesMessage';
import { tools, vpath } from '../helper';

export class NotesPanelView {
    private panel: vscode.WebviewPanel | undefined = undefined;
    private state: boolean = false;
    private tryCnt: number = 0;
    private viewData: twv.WVDomain | undefined;
    private dpathCache: string[] = [];

    private assetsFile = (name: string) => {
        const file = path.join(ext.context.extensionPath, 'out', name);
        return vscode.Uri.file(file)
            .with({ scheme: 'vscode-resource' })
            .toString();
    }

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
                    <script src="${this.assetsFile('main.wv.js')}"></script>
                </body>
                </html>`;
    }

    showNotesPlanView(): void {
        if (!this.panel) {
            this.initPanel();
        }

        if (this.tryCnt >= 200) {
            vscode.window.showErrorMessage('webview update failse 200 times.');
            return;
        }

        if (!this.state) {
            setTimeout(() => this.showNotesPlanView(), 10);
            this.tryCnt += 1;
            return;
        }

        this.tryCnt = 0;
        this.panel!.webview.postMessage({ command: 'data', data: this.viewData });
    }

    private initPanel() {
        this.panel = vscode.window.createWebviewPanel('vscode-note', 'vscode-note', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(ext.context.extensionPath, 'out'))]
        });
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
                this.state = false;
                console.log('vsnote webview closed.');
            },
            null,
            ext.context.subscriptions
        );
        this.panel.onDidChangeViewState(
            () => {
                if (this.panel && this.panel.visible) {
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
                    case 'ready':
                        this.state = true;
                        break;
                    case 'edit':
                        vscode.commands.executeCommand('vscode-note.note.edit', msg.data.id, msg.data.category);
                        break;
                    case 'edit-contentFile':
                        const id = msg.data.id;
                        const n = msg.data.n;
                        const v = vscode.Uri.file(ext.dbFS.getNoteContentFile(id, n));
                        vscode.commands.executeCommand('editExplorer.openFileResource', v);
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
                        vscode.commands.executeCommand('vscode-note.category.add');
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
        this.viewData!.categories.push({ name: name, notes: [] });
        return this;
    }

    private genViewData(): twv.WVDomain {
        const notes = ext.dbFS.dch.selectNotesUnderDomain(this.dpathCache);
        const categories: twv.WVCategory[] = [];
        for (const nId of notes) {
            const cname = ext.dbFS
                .readNoteMeta(nId)
                .tags.filter(tag => tools.stringArrayEqual(vpath.splitPath(tag.domain), this.dpathCache))[0]
                .category;
            const contents: string[] = ext.dbFS.selectNoteContents(nId);
            const isDoc = ext.dbFS.selectDocExist(nId);
            const isFiles = ext.dbFS.selectFilesExist(nId);

            if (categories.filter(c => c.name === cname).length >= 1) {
                categories
                    .filter(c => c.name === cname)[0]
                    .notes.push({ nId, contents, doc: isDoc, files: isFiles });
            } else {
                categories.push({ name: cname, notes: [{ nId, contents, doc: isDoc, files: isFiles }] });
            }
        }
        return { name: this.dpathCache[this.dpathCache.length - 1], categories: categories };
    }
}
