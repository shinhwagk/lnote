import { TreeDataProvider, EventEmitter, Event, TreeItem, ProviderResult } from 'vscode';
import { ext } from '../extensionVariables';
import { vpath } from '../helper';

export type DomainNode = string;

function createDomainNodes(dn: DomainNode): DomainNode[] {
    const dpath = vpath.splitPath(dn);
    return Object.keys(ext.dbFS.dch.selectDomain(dpath))
        .filter(t => t !== '.notes')
        .sort()
        .map(name => dpath.concat(name).join('/'));
}

function getTreeItem(dn: DomainNode): TreeItem {
    const dpath = vpath.splitPath(dn);
    const item: TreeItem = { label: dpath[dpath.length - 1] };
    const domain = ext.dbFS.dch.selectDomain(dpath);

    const childDomainNumber = Object.keys(domain).filter(name => name != '.notes').length;
    item.collapsibleState = childDomainNumber >= 1 ? 1 : 0;

    const notesTotalNumberUnderDomain = ext.dbFS.dch.selectAllNotesUnderDomain(dpath).length;
    const notesNumberUnderDomain = ext.dbFS.dch.selectNotesUnderDomain(dpath).length;

    item.description = `${notesNumberUnderDomain}/${notesTotalNumberUnderDomain}`;
    if (domain['.notes']) {
        item.command = {
            arguments: [dn],
            command: 'vscode-note.domain.pin',
            title: 'Show Vscode Note'
        };
    } else {
        item.contextValue = 'emptyNotes';
    }
    return item;
}

export class DomainExplorerProvider implements TreeDataProvider<DomainNode> {
    private _onDidChangeTreeData: EventEmitter<DomainNode | undefined> = new EventEmitter<DomainNode | undefined>();
    readonly onDidChangeTreeData: Event<DomainNode | undefined> = this._onDidChangeTreeData.event;

    public refresh(dn?: DomainNode): void {
        this._onDidChangeTreeData.fire(dn);
    }

    public getTreeItem(element: DomainNode): TreeItem {
        return getTreeItem(element);
    }

    public getChildren(element?: DomainNode): ProviderResult<DomainNode[]> {
        return element ? createDomainNodes(element) : createDomainNodes('');
    }

    public getParent(element: DomainNode): ProviderResult<DomainNode> {
        const dpath = vpath.splitPath(element);
        return dpath.length >= 2 ? dpath.slice(0, dpath.length - 1).join('/') : undefined;
    }
}
