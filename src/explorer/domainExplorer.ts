import { TreeDataProvider, EventEmitter, Event, TreeItem, ProviderResult } from 'vscode';
import { ext } from '../extensionVariables';

export class DomainNode extends TreeItem {
    dpath: string[] = [];
    constructor(
        private readonly parent: DomainNode | undefined = undefined,
        readonly label: string,
    ) {
        super(label);
        this.dpath = this.parent ? this.parent.dpath.concat(label) : [label];
    }

    getTreeItem(): TreeItem {
        return getTreeItem(this);
    }

    getChildren(): ProviderResult<DomainNode[]> {
        return createDomainNodes(this, this.dpath);
    }

    getParent(): DomainNode | undefined {
        return this.parent;
    }
}

function createDomainNodes(parent: DomainNode | undefined, dpath: string[]): DomainNode[] {
    return Object.keys(ext.dbFS.dch.selectDomain(dpath))
        .filter(t => t !== '.notes')
        .sort()
        .map(name => new DomainNode(parent, name));
}

function getTreeItem(element: DomainNode): DomainNode {
    const domain = ext.dbFS.dch.selectDomain(element.dpath);

    const childDomainNumber = Object.keys(domain).filter(name => name != '.notes').length;
    element.collapsibleState = childDomainNumber >= 1 ? 1 : 0;

    const notesTotalNumberUnderDomain = ext.dbFS.dch.selectAllNotesUnderDomain(element.dpath).length;
    const notesNumberUnderDomain = ext.dbFS.dch.selectNotesUnderDomain(element.dpath).length;

    element.description = `${notesNumberUnderDomain}/${notesTotalNumberUnderDomain}`;

    if (domain['.notes']) {
        element.command = {
            arguments: [element],
            command: 'vscode-note.domain.pin',
            title: 'Show Vscode Note'
        };
    } else {
        element.contextValue = 'emptyNotes';
    }
    return element;
}

export class DomainExplorerProvider implements TreeDataProvider<DomainNode> {
    private _onDidChangeTreeData: EventEmitter<DomainNode | undefined> = new EventEmitter<DomainNode | undefined>();
    readonly onDidChangeTreeData: Event<DomainNode | undefined> = this._onDidChangeTreeData.event;

    public refresh(dn?: DomainNode): void {

        this._onDidChangeTreeData.fire(dn);
    }

    public getTreeItem(element: DomainNode): TreeItem {
        return element.getTreeItem();
    }

    public getChildren(element?: DomainNode): ProviderResult<DomainNode[]> {
        return element ? element.getChildren() : createDomainNodes(undefined, []);
    }

    public getParent(element: DomainNode): ProviderResult<DomainNode> {
        return element.getParent();
    }
}
