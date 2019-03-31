import * as path from 'path';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { DatabaseFileSystem } from '../database';
import { ToWebView as twv } from './notesMessage';
import { tools, vpath } from '../helper';

export class NotesPanelView {
    private panel: vscode.WebviewPanel | undefined = undefined;
    private state: boolean = false;
    private tryCnt: number = 0;
    private viewData: twv.WVDomain | undefined;
    private dfs: DatabaseFileSystem;
    private ctx: vscode.ExtensionContext;
    private dpath: string[] = [];

    constructor(ctx: vscode.ExtensionContext, dfs: DatabaseFileSystem) {
        this.dfs = dfs;
        this.ctx = ctx;
    }

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
            this.ctx.subscriptions
        );
        this.panel.onDidChangeViewState(
            () => {
                if (this.panel && this.panel.visible) {
                    this.parseDomain(this.dpath);
                    this.showNotesPlanView();
                }
            },
            null,
            this.ctx.subscriptions
        );
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'ready':
                        this.state = true;
                        break;
                    case 'edit':
                        vscode.commands.executeCommand('vscode-note.note.edit', message.data);
                        break;
                    case 'edit-contentFile':
                        const id = message.data.id;
                        const n = message.data.n;
                        const v = vscode.Uri.file(ext.dbFS.getNoteContentFile(id, n));
                        vscode.commands.executeCommand('editExplorer.openFileResource', v);
                        break;
                    case 'doc':
                        vscode.commands.executeCommand('vscode-note.note.doc.show', message.data);
                        break;
                    case 'files':
                        vscode.commands.executeCommand('vscode-note.note.files.show', message.data);
                        break;
                    case 'add':
                        vscode.commands.executeCommand('vscode-note.note.add', message.data);
                        break;
                    case 'add-category':
                        vscode.commands.executeCommand('vscode-note.note.category.add');
                        break;
                }
            },
            undefined,
            this.ctx.subscriptions
        );
        this.panel.webview.html = this.getWebviewContent();
    }

    public parseDomain(dpath?: string[]) {
        this.dpath = dpath || this.dpath;
        this.viewData = this.genViewData();
        return this;
    }

    public addCategory(name: string) {
        this.viewData!.categories.push({ name: name, notes: [] });
        return this;
    }

    private genViewData(): twv.WVDomain {
        const dpath = this.dpath;
        const notes = this.dfs.dch.selectNotesUnderDomain(dpath);
        const categories: twv.WVCategory[] = [];
        for (const nId of notes) {
            const cname = this.dfs
                .readNoteMeta(nId)
                .tags.filter(tag => tools.arrayEqual(vpath.splitPath(tag.tag), dpath))[0].category;
            const contents: string[] = this.dfs.selectNoteContents(nId);
            const isDoc = this.dfs.selectDocExist(nId);
            const isFiles = this.dfs.selectFilesExist(nId);

            if (categories.filter(c => c.name === cname).length >= 1) {
                categories
                    .filter(c => c.name === cname)[0]
                    .notes.push({ nId, contents, doc: isDoc, files: isFiles });
            } else {
                categories.push({ name: cname, notes: [{ nId, contents, doc: isDoc, files: isFiles }] });
            }
        }
        return { name: dpath[dpath.length - 1], categories: categories };
    }
}
