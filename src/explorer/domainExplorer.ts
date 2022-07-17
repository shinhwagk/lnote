import { TreeDataProvider, EventEmitter, Event, TreeItem, ProviderResult } from 'vscode';

import { ext } from '../extensionVariables';
import { tools } from '../helper';

export type DomainNode = string;

function getTreeItem(dn: DomainNode): TreeItem {
    const domainNode = tools.splitDomaiNode(dn);
    const isNotes = ext.notesDatabase.checkNotesExist(domainNode)
    const notesTotalNumberUnderDomain = 0// ext.notesDatabase.getAllNotesNumberOfDomain(domainNode);
    const notesNumberUnderDomain = isNotes
        ? Object.values(ext.notesDatabase.getDomain(domainNode)['.categories']).flat().length //Object.values<any[]>(ext.notesDatabase.getNotes(domainNode)).map(c => c.length).reduce((a, b) => a + b, 0)
        : 0; //domain['.notes'].length;

    const item: TreeItem = { label: domainNode[domainNode.length - 1] };
    item.description = `${notesNumberUnderDomain}/${notesTotalNumberUnderDomain} `;
    item.collapsibleState = ext.notesDatabase.getChildrenNameOfDomain(domainNode).length >= 1 ? 1 : 0;
    if (isNotes) {
        item.command = {
            arguments: [dn],
            command: 'vscode-note.domain.pin',
            title: 'Show Vscode Note',
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
        if (element === undefined) {
            return ext.notesDatabase.getNoteBookNames()
        } else {
            const dn = tools.splitDomaiNode(element)
            return ext.notesDatabase.getChildrenNameOfDomain(dn)
                .sort()
                .map((name) => tools.joinDomainNode(dn.concat(name)));
        }
    }

    public getParent(element: DomainNode): ProviderResult<DomainNode> {
        const domainNode = tools.splitDomaiNode(element);
        return domainNode.length >= 2 ? tools.joinDomainNode(domainNode.slice(0, domainNode.length - 1)) : undefined;
    }
}
