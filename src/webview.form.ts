import * as path from "path";

import * as vscode from 'vscode';

export class VSNWebviewForm {
    panel: vscode.WebviewPanel | undefined;
    context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.panel = vscode.window.createWebviewPanel('catCoding', 'vs notes', vscode.ViewColumn.Three,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "public"))]
            },
        );
        this.activateReceiveMessage();
    }
    static activate(context: vscode.ExtensionContext) {
        return new VSNWebviewForm(context);
    }

    dispose() {
        if (this.panel) {
            this.panel.onDidDispose(() => {
                this.panel = undefined; console.log("vsnote webview closed.");
            }, null, this.context.subscriptions);
        }
    }

    activateReceiveMessage() {
        if (this.panel) {
            this.panel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'alert':
                        vscode.commands.executeCommand("updateOrCreateWebview", "dff", this.panel);
                        return;
                }
            }, undefined, this.context.subscriptions);
        }
    }
    commandhandler() {
        return vscode.commands.registerCommand('extension.note.create', (dpath: string) => {
            vscode.window.showInformationMessage("11212121");
            this.panel!.webview.html = getWebviewContent("sss");
        });
    }
}

  

function getWebviewContent(extensionPath: string) {
    const scriptPathOnDisk = vscode.Uri.file(path.join(extensionPath, 'public', 'main.js'));
    const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Cat Coding</title>
	</head>
	<body>
        <div id="root"></div>
		<script src="${scriptUri}"></script>
	</body>
	</html>`;
}