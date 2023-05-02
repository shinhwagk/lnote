import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { jointMark, nbGroup } from '../constants';

import { ext } from '../extensionVariables';
import { tools } from '../helper';
import { DomainNode } from '../types';

function getTreeItem(dn: DomainNode): TreeItem {
  const domainNode = tools.splitDomaiNode(dn);
  const nb = ext.lnbs.get(domainNode[0]);
  const isNotes = nb.getld().isNotes(domainNode);
  // const notesTotalNumberUnderDomain = 1;//ext.notebookDatabase.getNotesNumberUnderDomain(domainNode); // ext.notesDatabase.getAllNotesNumberOfDomain(domainNode);
  const notesNumberOfDomain = isNotes ? nb.getNotesOfDomain(domainNode, true).length : '-';//isNotes
  // ? ext.notebookDatabase.getNotesNumberOfDomain(domainNode) //  Object.values(ext.notebookDatabase.getDomain(domainNode)['.categories']).flat().length //Object.values<any[]>(ext.notesDatabase.getNotes(domainNode)).map(c => c.length).reduce((a, b) => a + b, 0)
  // : 0; // domain['.notes'].length;

  const item: TreeItem = { label: domainNode[domainNode.length - 1] };
  // item.description = `${notesNumberOfDomain}/${notesTotalNumberUnderDomain}`;
  item.description = `${notesNumberOfDomain}`;
  item.collapsibleState = nb.getld().getChildrenNamesOfDomain(domainNode).length >= 1 ? 1 : 0;

  if (isNotes) {
    item.command = {
      arguments: [dn],
      command: 'lnote.domain.pin',
      title: 'Show Vscode Note'
    };
  } else {
    item.contextValue = 'emptyNotes';
  }

  if (domainNode.length === 1) {
    item.contextValue = item.contextValue ? `${item.contextValue}-notebook` : 'notebook';
    item.description = nb.getln().getNotesByAls([`${nbGroup}${jointMark}${domainNode[0]}`]).length.toString();
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
      return ext.lnbs.getNames();
    } else {
      const domainNode = tools.splitDomaiNode(element);
      return ext.lnbs.get(domainNode[0])
        .getld()
        .getChildrenNamesOfDomain(domainNode)
        .sort()
        .map((name) => tools.joinDomainNode(domainNode.concat(name)));
    }
  }

  public getParent(element: DomainNode): ProviderResult<DomainNode> {
    const domainNode = tools.splitDomaiNode(element);
    return domainNode.length >= 2 ? tools.joinDomainNode(domainNode.slice(0, domainNode.length - 1)) : undefined;
  }
}
