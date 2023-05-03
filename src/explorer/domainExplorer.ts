import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { jointMark, nbGroup } from '../constants';

import { ext } from '../extensionVariables';
import { tools } from '../helper';
import { DomainNode, DomainNodeSplit } from '../types';

function getTreeItem(dn: DomainNode): TreeItem {
  const dns: DomainNodeSplit = tools.splitDomaiNode(dn);
  const nbn = dns[0]; // notebook name

  const nb = ext.lnbs.get(nbn);
  const isNotes = nb.getld().isNotes(dns);

  const item: TreeItem = { label: dns[dns.length - 1] };
  item.description = isNotes ? nb.getNotesOfDomain(dns, false).length.toString() : '-';//isNotes
  item.collapsibleState = nb.getld().getChildrenNamesOfDomain(dns).length >= 1 ? 1 : 0;

  if (isNotes) {
    item.command = {
      arguments: [dn],
      command: 'lnote.domain.pin',
      title: 'Show Vscode Note'
    };
  } else {
    item.contextValue = 'emptyNotes';
  }

  if (dns.length === 1) {
    item.contextValue = item.contextValue ? `${item.contextValue}-notebook` : 'notebook';
    item.description = nb.getln().getNotesByAls([`${nbGroup}${jointMark}${nbn}`]).length.toString();
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
