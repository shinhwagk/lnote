import { TreeDataProvider, EventEmitter, Event, TreeItem, ProviderResult } from 'vscode';
import { ext } from '../extensionVariables';

export class DomainNode {
    constructor(parent: DomainNode | undefined, dpath: string[]) {
        this.dpath = dpath;
        this.parent = parent;
    }
    dpath: string[];
    parent: DomainNode | undefined;

    static create(parent: DomainNode | undefined, dpath: string[]) {
        return new DomainNode(parent, dpath);
    }
}

export class DomainExplorerProvider implements TreeDataProvider<DomainNode> {
    private _onDidChangeTreeData: EventEmitter<DomainNode> = new EventEmitter<DomainNode>();
    readonly onDidChangeTreeData: Event<DomainNode> = this._onDidChangeTreeData.event;

    public refresh(dn?: DomainNode, parent: boolean = false): void {
        if (dn) {
            if (parent) {
                this._onDidChangeTreeData.fire(dn.parent);
                return;
            }
            this._onDidChangeTreeData.fire(dn);
        } else {
            this._onDidChangeTreeData.fire();
        }
    }

    public getTreeItem(element: DomainNode): TreeItem {
        const domain = ext.dbFS.dch.selectDomain(element.dpath);
        const childDomainNumber = Object.keys(domain).filter(name => name != '.notes').length;
        const notesTotalNumberUnderDomain = ext.dbFS.dch.selectAllNotesUnderDomain(element.dpath).length;
        const notesNumberUnderDomain = ext.dbFS.dch.selectNotesUnderDomain(element.dpath).length;
        const item: TreeItem = new TreeItem(
            element.dpath[element.dpath.length - 1],
            childDomainNumber >= 1 ? 1 : 0
        );
        item.description = `${notesNumberUnderDomain}/${notesTotalNumberUnderDomain}`;
        if (domain['.notes']) {
            item.command = {
                arguments: [element.dpath],
                command: 'vscode-note.domain.pin',
                title: 'Show Vscode Note'
            };
        } else {
            item.contextValue = 'emptyNotes';
        }
        return item;
    }

    public getChildren(element?: DomainNode): ProviderResult<DomainNode[]> {
        const dpath: string[] = element ? element.dpath : [];
        return Object.keys(ext.dbFS.dch.selectDomain(dpath))
            .filter(t => t !== '.notes')
            .sort()
            .map(name => DomainNode.create(element, dpath.concat(name)));
    }

    public getParent(element: DomainNode): ProviderResult<DomainNode> {
        return element.parent;
    }
}
