import * as path from 'path';

import * as vscode from 'vscode';

import { VSNDatabase } from '../database';
import { readdirSync } from 'fs-extra';

interface BaseNode {}

interface RootNode extends BaseNode {
    readonly id: number;
    readonly label: string;
    readonly contextValue: 'noteRootNode' | 'docRootNode' | 'filesRootNode' | 'none';
}

export function VSNEditExplorer() {
    const treeDataProvider = new VSNNoteEditExplorerProvider();
    const treeView = vscode.window.createTreeView('vsnoteEditExplorer', {
        treeDataProvider,
        showCollapseAll: true
    });
    return { treeDataProvider, treeView };
}

// function readDirectory(uri: vscode.Uri): Thenable<[string, NoteNode][]> {
//     const files = readdirSync(uri.fsPath);
//     const result: [string, NoteNode][] = [];
//     files.forEach(name => {
//         const u: vscode.Uri = vscode.Uri.file(path.join(uri.fsPath, name));
//         const f: NoteNode = { uri: u };
//         result.push([name, f]);
//     });
//     return Promise.resolve(result);
// }

export class VSNNoteEditExplorerProvider implements vscode.TreeDataProvider<RootNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<RootNode | undefined> = new vscode.EventEmitter<
        RootNode | undefined
    >();
    readonly onDidChangeTreeData: vscode.Event<RootNode | undefined> = this._onDidChangeTreeData.event;

    private _noteNode: RootNode | undefined;
    private _filesNode: RootNode | undefined;
    private _docNode: RootNode | undefined;

    public refresh(): any {
        this._onDidChangeTreeData.fire();
    }

    public refreshRegistries(): void {
        this._onDidChangeTreeData.fire(this._noteNode);
    }

    getTreeItem(element: RootNode): Thenable<vscode.TreeItem> {
        console.log(element);
        const treeItem = new vscode.TreeItem(element.contextValue, vscode.TreeItemCollapsibleState.Collapsed);

        // treeItem.command = {
        //     command: 'vsnoteEditExplorer.openFileResource',
        //     title: 'Open File',
        //     arguments: [element.uri]
        // };
        treeItem.label = element.label;
        return Promise.resolve(treeItem);
    }

    async getChildren(element?: RootNode): Promise<RootNode[]> {
        if (!element) {
            this.getRootNodes();
        }
        return [];
    }

    private async getRootNodes(): Promise<RootNode[]> {
        const rootNodes: RootNode[] = [];
        let node: RootNode;

        node = { label: `Note - `, contextValue: 'noteRootNode', id: element.id };
        rootNodes.push(node);
        this._noteNode = node;

        node = { label: 'Doc', contextValue: 'docRootNode', id: element.id };
        rootNodes.push(node);
        this._docNode = node;

        node = { label: 'Files', contextValue: 'filesRootNode', id: element.id };
        rootNodes.push(node);
        this._filesNode = node;

        return rootNodes;
    }
}
