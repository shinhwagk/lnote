import * as path from 'path';

import * as vscode from 'vscode';

import { VSNDatabase } from '../database';

export interface VSNDomainNode extends vscode.TreeItem {
    dpath: string;
}

export function VSNDomainExplorer(db: VSNDatabase): VSNDomainExplorerProvider {
    const treeDataProvider = new VSNDomainExplorerProvider(db);
    vscode.window.createTreeView('vsnoteDomainExplorer', { treeDataProvider });
    return treeDataProvider;
}

export class VSNDomainExplorerProvider implements vscode.TreeDataProvider<VSNDomainNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    public readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    private readonly db: VSNDatabase;

    constructor(db: VSNDatabase) {
        this.db = db;
    }

    public refresh(): any {
        this._onDidChangeTreeData.fire();
    }

    public async getTreeItem(element: VSNDomainNode): Promise<vscode.TreeItem> {
        return {
            collapsibleState: (this.db.selectDomain(element.dpath).domains.length >= 1
              ? true
              : false)
                ? 1
                : 0, // vscode.TreeItemCollapsibleState
            command: {
                arguments: [element.dpath],
                command: 'vsnPanel.update',
                title: 'Show Vscode Note'
            },
            label: path.basename(element.dpath)
        };
    }

    public async getChildren(element?: VSNDomainNode): Promise<VSNDomainNode[]> {
        const dpath: string = element ? element.dpath : '/';
        return this.db.selectDomain(dpath).domains.map(name => {
            return { dpath: path.join(dpath, name) };
        });
    }
}
