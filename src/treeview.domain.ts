import * as path from 'path';

import * as vscode from 'vscode';

import { VSNDatabase } from './database';

export interface VSNDomainNode extends vscode.TreeItem {
    dpath: string;
}

export function VSNDomainExplorer(db: VSNDatabase): VSNDomainTreeDataProvider {
    const treeDataProvider = new VSNDomainTreeDataProvider(db);
    vscode.window.createTreeView('vsnoteExplorer', { treeDataProvider });
    return treeDataProvider;
}

export class VSNDomainTreeDataProvider implements vscode.TreeDataProvider<VSNDomainNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    db: VSNDatabase;

    constructor(db: VSNDatabase) {
        this.db = db;
    }

    public refresh(): any {
        this._onDidChangeTreeData.fire();
    }

    async getTreeItem(element: VSNDomainNode): Promise<vscode.TreeItem> {
        return {
            collapsibleState: (this.db.selectDomain(element.dpath).domains.length >= 1
              ? true
              : false)
                ? 1
                : 0, // vscode.TreeItemCollapsibleState
            command: {
                arguments: [element.dpath],
                command: 'updateOrCreateWebview',
                title: 'Show Vscode Note'
            },
            label: path.basename(element.dpath)
        };
    }

    getChildren(element?: VSNDomainNode): Thenable<VSNDomainNode[]> {
        const dpath: string = element ? element.dpath : '/';
        return Promise.resolve(
            this.db.selectDomain(dpath).domains.map(name => {
                return { dpath: path.join(dpath, name) };
            })
        );
    }
}
