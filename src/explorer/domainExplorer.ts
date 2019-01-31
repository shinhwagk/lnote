import * as path from 'path';
import * as vscode from 'vscode';
import { selectDomain, selectDomainNotesCount } from '../database';
import { vpath } from '../helper';

export interface VSNDomainNode {
    dpath: string;
}

export class VSNDomainExplorerProvider implements vscode.TreeDataProvider<VSNDomainNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<VSNDomainNode> = new vscode.EventEmitter<
        VSNDomainNode
    >();
    public readonly onDidChangeTreeData: vscode.Event<VSNDomainNode> = this._onDidChangeTreeData.event;

    public refresh(): any {
        this._onDidChangeTreeData.fire();
    }

    public async getTreeItem(element: VSNDomainNode): Promise<vscode.TreeItem> {
        const domain = await selectDomain(element.dpath);
        const item = new vscode.TreeItem(path.basename(element.dpath), domain.domains.length >= 1 ? 1 : 0);
        item.contextValue = 'vsnDomainNode';
        item.description = `${domain.notes.length}/${await selectDomainNotesCount(element.dpath)}`;
        if (domain.notes.length >= 1) {
            item.command = {
                arguments: [element.dpath],
                command: 'vscode-note.domain-explorer.pin',
                title: 'Show Vscode Note'
            };
        }
        return item;
    }

    public async getChildren(element?: VSNDomainNode): Promise<VSNDomainNode[]> {
        const dpath: string = element ? element.dpath : vpath.splitStr;
        const domain = await selectDomain(dpath);
        return domain.domains.map(name => {
            return { dpath: path.join(dpath, name) };
        });
    }
}
