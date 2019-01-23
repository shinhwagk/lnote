import * as path from 'path';

import * as vscode from 'vscode';

import { VSNNote } from '../database';
import { ToWebView as twv } from './message';
import { ext } from '../extensionVariables';

const assetsFile = (name: string) => {
    const file = path.join(ext.context.extensionPath, 'out', name);
    return vscode.Uri.file(file)
        .with({ scheme: 'vscode-resource' })
        .toString();
};

function getWebviewContent() {
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>vscode-note</title>
	</head>
    <body>
        <div id="root"></div>
        <script src="${assetsFile('main.wv.js')}"></script>
	</body>
	</html>`;
}

export class VSNWebviewPanel {
    public panel: vscode.WebviewPanel | undefined = undefined;
    private state: boolean = false;
    private trayCnt: number = 0;
    private extPath: string;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.extPath = context.extensionPath;
        this.context = context;
    }

    public initIfNeed() {
        if (!this.state) {
            this.init();
        }
    }

    public updateWebviewContent(domain: twv.VSNWVDomain): void {
        if (this.trayCnt >= 50) {
            vscode.window.showErrorMessage('webview update failse 50 times.');
            return;
        }
        if (!this.state) {
            setTimeout(() => this.updateWebviewContent(domain), 100);
            this.trayCnt += 1;
            return;
        }
        if (this.panel) {
            this.trayCnt = 0;
            this.panel!.webview.postMessage({ command: 'data', data: domain });
        }
    }

    private init() {
        this.createPanel();
        this.panel!.onDidDispose(
            () => {
                this.panel = undefined;
                this.state = false;
                console.log('vsnote webview closed.');
            },
            null,
            this.context.subscriptions
        );
        this.panel!.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'ready':
                        this.state = message.data;
                        break;
                    case 'edit':
                        vscode.commands.executeCommand('vscode-note.note.edit', message.data);
                        break;
                    case 'doc':
                        vscode.commands.executeCommand('vscode-note.note.doc.showPreview', message.data);
                }
            },
            undefined,
            this.context.subscriptions
        );
        this.panel!.webview.html = getWebviewContent();
    }

    private createPanel() {
        this.panel = vscode.window.createWebviewPanel('catCoding', 'vscode-note', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.extPath, 'out'))]
        });
    }
}

export function fusionNotes(name: string, ns: VSNNote[]): twv.VSNWVDomain {
    const categorys: twv.VSNWVCategory[] = [];
    function testCategoryExist(name: string): boolean {
        return categorys.filter(c => c.name === name).length >= 1 ? true : false;
    }
    for (const n of ns) {
        if (!testCategoryExist(n.meta.category)) {
            categorys.push({ name: n.meta.category, notes: [] });
        }

        categorys
            .filter(c => c.name === n.meta.category)[0]
            .notes.push({ id: n.id, contents: n.contents, doc: n.meta.doc });
    }
    return { name, categorys };
}
