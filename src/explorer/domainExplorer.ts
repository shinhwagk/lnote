import { TreeDataProvider, EventEmitter, Event, TreeItem, ProviderResult } from 'vscode';

import { ext } from '../extensionVariables';
import { metaFields } from '../constants';

export type DomainNode = string;

export namespace Tools {
    const splitter = '@!$';
    export function joinDomainNode(domain: string[]): string {
        return domain.join(splitter);
    }

    export function splitDomaiNode(domain: string): string[] {
        return domain.split(splitter);
    }
}

function createDomainNodes(domainNode: string[]): DomainNode[] {
    return Object.keys(ext.domainDB.getDomain(domainNode))
        .filter((name) => !metaFields.includes(name))
        .sort()
        .map((name) => Tools.joinDomainNode(domainNode.concat(name)));
}

function getTreeItem(dn: DomainNode): TreeItem {
    const domainNode = Tools.splitDomaiNode(dn);
    const item: TreeItem = { label: domainNode[domainNode.length - 1] };
    const domain = ext.domainDB.getDomain(domainNode);

    const childDomainNumber = Object.keys(domain).filter((name) => !metaFields.includes(name)).length;
    item.collapsibleState = childDomainNumber >= 1 ? 1 : 0;

    const notesTotalNumberUnderDomain = ext.domainDB.getAllNotesUnderDomain(domainNode).length;
    const notesNumberUnderDomain = domain['.notes'].length;
    const domainLabels = domain['.labels'].join(',')

    item.description = `${notesNumberUnderDomain}/${notesTotalNumberUnderDomain} ${domainLabels}`;
    if (domain['.notes'].length >= 1) {
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
        const domainNode = element ? Tools.splitDomaiNode(element) : [];
        return createDomainNodes(domainNode);
    }

    public getParent(element: DomainNode): ProviderResult<DomainNode> {
        const domainNode = Tools.splitDomaiNode(element);
        return domainNode.length >= 2 ? Tools.joinDomainNode(domainNode.slice(0, domainNode.length - 1)) : undefined;
    }
}
