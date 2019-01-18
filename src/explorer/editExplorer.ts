import * as path from 'path';

import * as vscode from 'vscode';

import { RootNode } from './models/rootNode';
import { NodeBase } from './models/nodeBase';

export function VSNEditExplorer() {
    const treeDataProvider = new VSNNoteEditExplorerProvider();
    const treeView = vscode.window.createTreeView('vsnoteEditExplorer', {
        treeDataProvider,
        showCollapseAll: true
    });
    return { treeDataProvider, treeView };
}

export class VSNNoteEditExplorerProvider implements vscode.TreeDataProvider<NodeBase> {
    private _onDidChangeTreeData: vscode.EventEmitter<NodeBase> = new vscode.EventEmitter<NodeBase>();
    public readonly onDidChangeTreeData: vscode.Event<NodeBase> = this._onDidChangeTreeData.event;

    private _noteNode: RootNode | undefined;
    private _filesNode: RootNode | undefined;
    private _docNode: RootNode | undefined;

    public refresh(id: number): void {
        this.refreshNote();
        this.refreshFiles();
        this.refreshDoc();
    }
    public refreshNote(): void {
        this._onDidChangeTreeData.fire(this._noteNode);
    }
    public refreshFiles(): void {
        this._onDidChangeTreeData.fire(this._filesNode);
    }

    public refreshDoc(): void {
        this._onDidChangeTreeData.fire(this._docNode);
    }

    public getTreeItem(element: NodeBase): vscode.TreeItem {
        return element.getTreeItem();
    }

    public async getChildren(element?: NodeBase): Promise<NodeBase[]> {
        if (!element) {
            return this.getRootNodes();
        }
        return element.getChildren(element);
    }

    private async getRootNodes(): Promise<RootNode[]> {
        const rootNodes: RootNode[] = [];
        let node: RootNode;

        node = new RootNode('Note', 'noteRootNode');
        rootNodes.push(node);
        this._noteNode = node;

        node = new RootNode('Doc', 'docRootNode');
        rootNodes.push(node);
        this._noteNode = node;

        node = new RootNode('Files', 'filesRootNode');
        rootNodes.push(node);
        this._noteNode = node;

        return rootNodes;
    }
}
