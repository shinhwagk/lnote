import { TreeDataProvider, EventEmitter, Event, TreeItem, ProviderResult } from 'vscode';

import { pathSplit } from '../constants';
import { NotesDatabase } from '../database';
import { ext } from '../extensionVariables';
import { tools } from '../helper';

export type DomainNode = string;



function createDomainNodes(domainNode: string[]): DomainNode[] {
    return Object.keys(ext.notesDatabase.getDomainNames(domainNode))
        .sort()
        .map((name) => tools.joinDomainNode(domainNode.concat(name)));
}

function getTreeItem(dn: DomainNode): TreeItem {
    const domainNode = tools.splitDomaiNode(dn);
    const item: TreeItem = { label: domainNode[domainNode.length - 1] };
    const domainNames = ext.notesDatabase.getDomainNames(domainNode);
    console.log("11111111111111")
    const isNotes = ext.notesDatabase.checkNotesExist(domainNode)
    console.log("22222222")
    const childNumberOfDomain = domainNames.length;
    item.collapsibleState = childNumberOfDomain >= 1 ? 1 : 0;
    console.log("11111111111111")
    const notesTotalNumberUnderDomain = 0// ext.notesDatabase.getAllNotesNumberOfDomain(domainNode);
    const notesNumberUnderDomain = isNotes
        ? Object.values(ext.notesDatabase.getDomain(domainNode)['.categories']).flat().length //Object.values<any[]>(ext.notesDatabase.getNotes(domainNode)).map(c => c.length).reduce((a, b) => a + b, 0)
        : 0; //domain['.notes'].length;
    console.log("11111111111111")
    item.description = `${notesNumberUnderDomain}/${notesTotalNumberUnderDomain} `;
    if (notesNumberUnderDomain >= 1) {
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

    constructor() { }

    public refresh(dn?: DomainNode): void {
        this._onDidChangeTreeData.fire(dn);
    }

    public getTreeItem(element: DomainNode): TreeItem {
        return getTreeItem(element);
    }

    public getChildren(element?: DomainNode): ProviderResult<DomainNode[]> {
        // const domainNode = element === undefined ? [] : tools.splitDomaiNode(element);
        if (element === undefined) {
            return ext.notesDatabase.getRootDomain()
        } else {
            return createDomainNodes(tools.splitDomaiNode(element));
        }

    }

    public getParent(element: DomainNode): ProviderResult<DomainNode> {
        const domainNode = tools.splitDomaiNode(element);
        return domainNode.length >= 2 ? tools.joinDomainNode(domainNode.slice(0, domainNode.length - 1)) : undefined;
    }
}
