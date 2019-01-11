import * as path from 'path';

import * as vscode from 'vscode';

import { VSNDatabase, VSNNote } from './database';

export interface VSNWVDomain {
    name: string;
    categorys: VSNWVCategory[];
}

export interface VSNWVCategory {
    name: string;
    notes: VSNWVNote[];
}

interface VSNWVNote {
    id: number;
    contents: string[];
}

let panel: vscode.WebviewPanel | undefined = undefined;

function getWebviewContent(context: vscode.ExtensionContext) {
    const scriptPathOnDisk = vscode.Uri.file(
        path.join(context.extensionPath, 'out', 'main.wv.js')
    );
    const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
    const reactUrl = vscode.Uri.file(path.join(context.extensionPath, 'out', 'react.production.min.js')).with({ scheme: 'vscode-resource' });
    const reactDomUrl = vscode.Uri.file(path.join(context.extensionPath, 'out', 'react-dom.production.min.js')).with({ scheme: 'vscode-resource' });
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
        <script src="${reactUrl}" crossorigin></script>
        <script src="${reactDomUrl}" crossorigin></script>
	</head>
    <body>
    2
        <div id="root"></div>
        <script src="${scriptUri.toString()}"></script>
	</body>
	</html>`;
}

let statss = false;
export function VSNWebviewView(context: vscode.ExtensionContext, db: VSNDatabase) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'updateOrCreateWebview',
            (dpath: string) => {
                vscode.window.showInformationMessage("update web view")
                if (!panel) {
                    vscode.window.showInformationMessage("create web view panel.")
                    panel = vscode.window.createWebviewPanel(
                        'catCoding',
                        'vs notes',
                        vscode.ViewColumn.One,
                        {
                            enableScripts: true,
                            localResourceRoots: [
                                vscode.Uri.file(
                                    path.join(context.extensionPath, 'out')
                                )
                            ]
                        }
                    );

                    panel.onDidDispose(
                        () => {
                            panel = undefined;
                            statss = false;
                            console.log('vsnote webview closed.');
                        },
                        null,
                        context.subscriptions
                    );
                    panel.webview.onDidReceiveMessage(message => {
                        vscode.window.showInformationMessage(message.status)
                        if (message.status === "ready") { vscode.window.showInformationMessage("web ok."); statss = true; }
                    },
                        undefined,
                        context.subscriptions
                    );
                    panel.webview.html = getWebviewContent(context);
                }
                const notes: VSNNote[] = db.selectNotes(dpath);
                const categorys: VSNWVCategory[] = fusionNote(notes);

                const domain: VSNWVDomain = {
                    name: dpath,
                    categorys: []
                };

                vscode.window.showInformationMessage("222" + panel!.visible.toString());
                vscode.window.showInformationMessage("fff" + panel!.active.toString());
                updateWebviewPanel(domain);
            }
        )
    );
}

function updateWebviewPanel(domain: VSNWVDomain): void {
    if (!statss) {
        setTimeout(() => updateWebviewPanel(domain), 10);
        return;
    }
    vscode.window.showInformationMessage("post message.");
    panel!.webview.postMessage(domain)
}

function fusionNote(ns: VSNNote[]): VSNWVCategory[] {
    const categorys: VSNWVCategory[] = [];
    function testCategoryExist(name: string): boolean {
        return categorys.filter(c => c.name === name).length >= 1
            ? true
            : false;
    }
    for (const n of ns) {
        if (!testCategoryExist(n.meta.category)) {
            categorys.push({ name: n.meta.category, notes: [] });
        }
        categorys
            .filter(c => c.name === n.meta.category)[0]
            .notes.push({ id: n.id, contents: n.contents });
    }
    return categorys;
}
