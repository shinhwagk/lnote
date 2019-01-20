import * as path from 'path';

import * as vscode from 'vscode';

import { selectDomain } from '../database';
import { dom } from '@fortawesome/fontawesome-svg-core';

export interface VSNDomainNode extends vscode.TreeItem {
    dpath: string;
}

export class VSNDomainExplorerProvider implements vscode.TreeDataProvider<VSNDomainNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    public readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

    public refresh(): any {
        this._onDidChangeTreeData.fire();
    }

    public async getTreeItem(element: VSNDomainNode): Promise<vscode.TreeItem> {
        const domain = await selectDomain(element.dpath);
        return {
            collapsibleState: (domain.domains.length >= 1 ? true : false) ? 1 : 0, // vscode.TreeItemCollapsibleState
            command: {
                arguments: [element.dpath],
                command: 'vsnPanel.update',
                title: 'Show Vscode Note'
            },
            contextValue: 'vsnDomainNode',
            label: path.basename(element.dpath)
        };
    }

    public async getChildren(element?: VSNDomainNode): Promise<VSNDomainNode[]> {
        const dpath: string = element ? element.dpath : '/';
        const domain = await selectDomain(dpath);
        return domain.domains.map(name => {
            return { dpath: path.join(dpath, name) };
        });
    }
}
