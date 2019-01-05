import * as path from "path";

import * as vscode from "vscode";

import * as db from "./database";

export interface NoteNode {
	uri: vscode.Uri;
}

export class NoteExplorer {
	// private ftpViewer: vscode.TreeView<NoteNode>;

	constructor(context: vscode.ExtensionContext) {

		const treeDataProvider = new NoteTreeDataProvider();
		// context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('ftp', treeDataProvider));

		// this.ftpViewer = 
		vscode.window.createTreeView('noteExplorer', { treeDataProvider });
		// vscode.commands.registerCommand('ftpExplorer.refresh', () => treeDataProvider.refresh());
		// vscode.commands.registerCommand('ftpExplorer.openFtpResource', folder => this.openResource(folder));
		// vscode.commands.registerCommand('ftpExplorer.revealResource', () => this.reveal());
	}
}

export class NoteTreeDataProvider implements vscode.TreeDataProvider<NoteNode>{

	// onDidChangeTreeData?: vscode.Event<NoteNode>;
	async getTreeItem(element: NoteNode): Promise<vscode.TreeItem> {
		return {
			collapsibleState: db.existChildDomain(element.uri) ? 1 : 0, // vscode.TreeItemCollapsibleState
			command: {
				arguments: [element.uri],
				command: "updateOrCreateWebview",
				title: "Show Vscode Note",
			},
			label: path.basename(element.uri.toString())
		};
	}

	getChildren(element?: NoteNode): Thenable<NoteNode[]> {
		const vsnUri = element ? element.uri : vscode.Uri.parse("notes://vscode-note/");
		return Promise.resolve(db.readChildDomain(vsnUri).map(uri => { return { uri: uri }; }));
	}
}
