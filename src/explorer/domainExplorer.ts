import * as path from 'path';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';

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
        const domain = ext.dbFS.selectDomain(element.dpath);
        const childDomainNumber = Object.keys(domain).filter(name => name != '.notes').length;
        const notesTotalNumberUnderDomain = ext.dbFS.selectAllNotesUnderDomain(element.dpath).length;
        const notesNumberUnderDomain = ext.dbFS.selectNotesUnderDomain(element.dpath).length;
        const item: vscode.TreeItem = {};
        item.label = path.basename(element.dpath[element.dpath.length - 1]);
        item.contextValue = 'domainNode';
        item.description = `${notesNumberUnderDomain}/${notesTotalNumberUnderDomain}`;
        item.collapsibleState = childDomainNumber >= 1 ? 1 : 0;
        if (domain['.notes']) {
            item.command = {
                arguments: [element.dpath],
                command: 'vscode-note.domain.pin',
                title: 'Show Vscode Note'
            };
        }
        return item;
    }

    public async getChildren(element?: DomainNode): Promise<DomainNode[]> {
        const dpath: string[] = element ? element.dpath : [];
        const domain = ext.dbFS.selectDomain(dpath);
        return Object.keys(domain)
            .filter(t => t !== '.notes')
            .sort()
            .map(name => {
                return { dpath: dpath.concat(name) };
            });
    }
}
