"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainExplorerProvider = void 0;
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const extensionVariables_1 = require("../extensionVariables");
const helper_1 = require("../helper");
function getTreeItem(dn) {
    const dns = helper_1.tools.splitDomaiNode(dn);
    const nbn = dns[0]; // notebook name
    const nb = extensionVariables_1.ext.lnbs.get(nbn);
    const isNotes = nb.getld().isNotes(dns);
    const item = { label: dns[dns.length - 1] };
    item.description = isNotes ? nb.getNotesOfDomain(dns, false).length.toString() : '-'; //isNotes
    item.collapsibleState = nb.getld().getChildrenNamesOfDomain(dns).length >= 1 ? 1 : 0;
    if (isNotes) {
        item.command = {
            arguments: [dn],
            command: 'lnote.domain.pin',
            title: 'Show Vscode Note'
        };
    }
    else {
        item.contextValue = 'emptyNotes';
    }
    if (dns.length === 1) {
        item.contextValue = item.contextValue ? `${item.contextValue}-notebook` : 'notebook';
        item.description = nb.getln().getNotesByAls([`${constants_1.nbGroup}${constants_1.jointMark}${nbn}`]).length.toString();
    }
    return item;
}
class DomainExplorerProvider {
    _onDidChangeTreeData = new vscode_1.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    refresh(dn) {
        this._onDidChangeTreeData.fire(dn);
    }
    getTreeItem(element) {
        return getTreeItem(element);
    }
    getChildren(element) {
        if (element === undefined) {
            return extensionVariables_1.ext.lnbs.getNames();
        }
        else {
            const dns = helper_1.tools.splitDomaiNode(element);
            return extensionVariables_1.ext.lnbs.get(dns[0])
                .getld()
                .getChildrenNamesOfDomain(dns)
                .sort()
                .map((name) => helper_1.tools.joinDomainNode(dns.concat(name)));
        }
    }
    getParent(element) {
        const domainNode = helper_1.tools.splitDomaiNode(element);
        return domainNode.length >= 2 ? helper_1.tools.joinDomainNode(domainNode.slice(0, domainNode.length - 1)) : undefined;
    }
}
exports.DomainExplorerProvider = DomainExplorerProvider;
//# sourceMappingURL=domainExplorer.js.map