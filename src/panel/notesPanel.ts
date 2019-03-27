import * as path from 'path';
import * as vscode from 'vscode';
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

let panel: vscode.WebviewPanel | undefined;
let state: boolean = false;
let tryCnt: number = 0;

export async function updateNotePanelContent(viewData: any): Promise<void> {
    if (!panel) {
        init(viewData);
    }

    if (tryCnt >= 50) {
        vscode.window.showErrorMessage('webview update failse 50 times.');
        return;
    }
    if (!state) {
        setTimeout(async () => await updateNotePanelContent(viewData), 100);
        tryCnt += 1;
        return;
    }

    tryCnt = 0;
    panel!.webview.postMessage({ command: 'data', data: viewData });
}

function init(viewData: any) {
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
                updateNotePanelContent(viewData);
            }
        },
        null,
        ext.context.subscriptions
    );
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'ready':
                    state = true;
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
