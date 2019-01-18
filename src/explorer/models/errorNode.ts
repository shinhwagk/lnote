import * as path from 'path';
import * as vscode from 'vscode';

import { NodeBase } from './nodeBase';

export type IconPath =
    | string
    | vscode.Uri
    | { light: string | vscode.Uri; dark: string | vscode.Uri }
    | vscode.ThemeIcon;

export class ErrorNode extends NodeBase {
    public static readonly getImagesErrorContextValue: string = 'ErrorNode.getImages';
    public static readonly getContainersErrorContextValue: string = 'ErrorNode.getContainers';

    // public readonly iconPath: IconPath = path.join(imagesPath, 'warning.svg');
    public readonly iconPath: IconPath = path.join('imagesPath', 'warning.svg');

    constructor(error: unknown, public readonly contextValue: string) {
        // super(parseError(error).message);
        super('dfd');
    }
}
