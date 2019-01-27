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

let panel: vscode.WebviewPanel | undefined = undefined;
let state: boolean = false;
let tryCnt: number = 0;

export function updateContent(domain: twv.VSNWVDomain): void {
    if (!panel) init();

    if (tryCnt >= 50) {
        vscode.window.showErrorMessage('webview update failse 50 times.');
        return;
    }
    if (!state) {
        setTimeout(() => updateContent(domain), 100);
        tryCnt += 1;
        return;
    }
    if (panel) {
        tryCnt = 0;
        panel.webview.postMessage({ command: 'data', data: domain });
    }
}

function init() {
    panel = vscode.window.createWebviewPanel('vscode-note', 'vscode-note', vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(path.join(ext.context.extensionPath, 'out'))]
    });
    panel.onDidDispose(
        () => {
            panel = undefined;
            state = false;
            console.log('vsnote webview closed.');
        },
        null,
        ext.context.subscriptions
    );
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'ready':
                    state = message.data;
                    break;
                case 'edit':
                    vscode.commands.executeCommand('vscode-note.note.edit', message.data);
                    break;
                case 'doc':
                    vscode.commands.executeCommand('vscode-note.note.doc.showPreview', message.data);
                    break;
                case 'files':
                    vscode.commands.executeCommand('vscode-note.note.doc.showPreview', message.data);
                    break;
            }
        },
        undefined,
        ext.context.subscriptions
    );
    panel.webview.html = getWebviewContent();
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
            .notes.push({ id: n.id, contents: n.contents, doc: n.meta.docOrFiles });
    }
    return { name, categorys };
}
