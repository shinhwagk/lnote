import * as path from 'path';
import * as vscode from 'vscode';
import { selectDomain, selectAllNotesUnderDomain } from '../database';

export interface DomainNode {
    dpath: string[];
}

export class DomainExplorerProvider implements vscode.TreeDataProvider<DomainNode> {
    private _onDidChangeTreeData: vscode.EventEmitter<DomainNode> = new vscode.EventEmitter<DomainNode>();
    public readonly onDidChangeTreeData: vscode.Event<DomainNode> = this._onDidChangeTreeData.event;

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    public async getTreeItem(element: DomainNode): Promise<vscode.TreeItem> {
        const domain = await selectDomain(element.dpath);
        const childDomainNumber = Object.keys(domain).length;
        const notesNumberUnderDomain = (await selectAllNotesUnderDomain(domain)).length;
        const item: vscode.TreeItem = {};
        item.label = path.basename(element.dpath[element.dpath.length - 1]);
        item.contextValue = 'domainNode';
        if (domain['.notes']) {
            item.collapsibleState = childDomainNumber - 1 >= 1 ? 1 : 0; // sub '.notes'
            item.description = `${domain['.notes'].length}/${notesNumberUnderDomain}`;
            item.command = {
                arguments: [element.dpath],
                command: 'vscode-note.domain-explorer.pin',
                title: 'Show Vscode Note'
            };
        } else {
            item.collapsibleState = childDomainNumber >= 1 ? 1 : 0;
            item.description = `0/${notesNumberUnderDomain}`;
        }
        return item;
    }

    public async getChildren(element?: DomainNode): Promise<DomainNode[]> {
        const dpath: string[] = element ? element.dpath : [];
        const domain = await selectDomain(dpath);
        return Object.keys(domain).sort()
            .filter(t => t !== '.notes')
            .map(name => {
                return { dpath: dpath.concat(name) };
            }).sort();
    }
}
