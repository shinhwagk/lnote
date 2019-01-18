import * as vscode from 'vscode';

export abstract class NodeBase {
    public readonly label: string;
    public abstract readonly contextValue: string;
    protected constructor(label: string) {
        this.label = label;
    }
    public getTreeItem(): vscode.TreeItem {
        return {
            label: this.label,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: this.contextValue
        };
    }
    public async getChildren(element: NodeBase): Promise<NodeBase[]> {
        return [];
    }
}
