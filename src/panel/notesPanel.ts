import * as path from 'path';
import * as vscode from 'vscode';
import { selectDocExist, selectDomain, selectFilesExist, selectNoteContents } from '../database';
import { ext } from '../extensionVariables';
import { ToWebView as twv } from './notesMessage';

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

let panel: vscode.WebviewPanel | undefined;
let state: boolean = false;
let tryCnt: number = 0;

export async function updateContent(): Promise<void> {
    if (!panel) {
        init();
    }

    if (tryCnt >= 50) {
        vscode.window.showErrorMessage('webview update failse 50 times.');
        return;
    }
    if (!state) {
        setTimeout(async () => await updateContent(), 100);
        tryCnt += 1;
        return;
    }
    if (panel) {
        const dpath: string[] = ext.context.globalState.get<string[]>('dpath')!;
        tryCnt = 0;
        const command = 'data';
        const data = await genViewDataByDpath(dpath);
        panel.webview.postMessage({ command, data });
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
    panel.onDidChangeViewState(
        () => {
            if (panel && panel.visible) {
                updateContent();
            }
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
        ext.context.subscriptions
    );
    panel.webview.html = getWebviewContent();
}

export async function genViewDataByDpath(dpath: string[]): Promise<twv.WVDomain> {
    const domain = await selectDomain(dpath);
    const categories = [];
    for (const name of Object.keys(domain['.categories'])) {
        const notes = [];
        for (const nId of domain['.categories'][name]) {
            const contents: string[] = await selectNoteContents(nId);
            const isDoc = selectDocExist(nId);
            const isFiles = selectFilesExist(nId);
            notes.push({ nId, contents, doc: isDoc, files: isFiles });
        }
        categories.push({ name, notes });
    }
    return { name: dpath[dpath.length - 1], categories };
}
