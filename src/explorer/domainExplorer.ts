import { TreeDataProvider, EventEmitter, Event, TreeItem, ProviderResult } from 'vscode';
import { ext } from '../extensionVariables';
import { vpath } from '../helper';

export type DomainNode = string;

function domainNodeParent(dn: DomainNode) {
    const tdn = vpath.splitPath(dn);
    tdn.pop();
    return tdn.join('/');
}

export class DomainExplorerProvider implements TreeDataProvider<DomainNode> {
    private _onDidChangeTreeData: EventEmitter<DomainNode> = new EventEmitter<DomainNode>();
    readonly onDidChangeTreeData: Event<DomainNode> = this._onDidChangeTreeData.event;

    public refresh(dn?: DomainNode, parent: boolean = false): void {
        if (!dn) {
            this._onDidChangeTreeData.fire(); return;
        }
        if (parent) {
            this._onDidChangeTreeData.fire(domainNodeParent(dn));
            return;
        }
        this._onDidChangeTreeData.fire(dn);
    }

    public getTreeItem(element: DomainNode): TreeItem {
        const dpath = vpath.splitPath(element);
        const domain = ext.dbFS.dch.selectDomain(dpath);
        const childDomainNumber = Object.keys(domain).filter(name => name != '.notes').length;
        const notesTotalNumberUnderDomain = ext.dbFS.dch.selectAllNotesUnderDomain(dpath).length;
        const notesNumberUnderDomain = ext.dbFS.dch.selectNotesUnderDomain(dpath).length;
        const item: TreeItem = new TreeItem(
            dpath[dpath.length - 1],
            childDomainNumber >= 1 ? 1 : 0
        );
        item.description = `${notesNumberUnderDomain}/${notesTotalNumberUnderDomain}`;
        if (domain['.notes']) {
            item.command = {
                arguments: [element],
                command: 'vscode-note.domain.pin',
                title: 'Show Vscode Note'
            };
        } else {
            item.contextValue = 'emptyNotes';
        }
        return item;
    }

    public getChildren(element?: DomainNode): ProviderResult<DomainNode[]> {
        const dpath: string[] = element ? vpath.splitPath(element) : [];
        return Object.keys(ext.dbFS.dch.selectDomain(dpath))
            .filter(t => t !== '.notes')
            .sort()
            .map(name => dpath.concat(name).join('/'));
    }

    public getParent(element: DomainNode): ProviderResult<DomainNode> {
        return domainNodeParent(element);
    }
}
