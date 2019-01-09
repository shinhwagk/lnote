import * as path from "path";

import * as vscode from 'vscode';

import { VSNDatabase, VSNNote } from "./database";

export interface VSNWVDomain {
    name: string;
    categorys: VSNWVCategory[];
}
export interface VSNWVCategory {
    name: string;
    notes: VSNWVNote[];
}

// vscode note web view note
interface VSNWVNote {
    id: number;
    contents: string[];
}


let panel: vscode.WebviewPanel | undefined = undefined;

function getWebviewContent(context: vscode.ExtensionContext) {
    const scriptPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'assets', 'main.js'));
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

export function VSNWebviewView(context: vscode.ExtensionContext, db: VSNDatabase) {
    context.subscriptions.push(
        vscode.commands.registerCommand('updateOrCreateWebview', (dpath: string) => {
            if (!panel) {
                panel = vscode.window.createWebviewPanel('catCoding', 'vs notes', vscode.ViewColumn.Two,
                    {
                        enableScripts: true,
                        localResourceRoots: [
                            vscode.Uri.file(path.join(context.extensionPath, "assets"))
                        ]
                    },
                );
                panel.onDidDispose(() => { panel = undefined; console.log("vsnote webview closed."); }, null, context.subscriptions);
                panel.webview.html = getWebviewContent(context);
            }
            const notes: VSNNote[] = db.selectNotes(dpath);
            const categorys: VSNWVCategory[] = fusionNote(notes);

            const domain: VSNWVDomain = { name: path.basename(dpath), categorys: categorys };
            updateWebviewPanel(domain);
        })
    );
}

function updateWebviewPanel(domain: VSNWVDomain) {
    panel!.webview.postMessage(domain);
}

function fusionNote(ns: VSNNote[]): VSNWVCategory[] {
    const categorys: VSNWVCategory[] = [];
    function testCategoryExist(name: string): boolean {
        return categorys.filter(c => c.name === name).length >= 1 ? true : false;
    }
    for (const n of ns) {
        if (!testCategoryExist(n.meta.category)) {
            categorys.push({ name: n.meta.category, notes: [] });
        }
        categorys.filter(c => c.name === n.meta.category)[0].notes.push({ id: n.id, contents: n.contents });

    }
    return categorys;
}