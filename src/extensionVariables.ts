import { existsSync } from 'fs';
import path from 'path';
import {
  commands, ConfigurationChangeEvent, ExtensionContext, StatusBarItem, TreeView, window, workspace
} from 'vscode';

import { section } from './constants';
import { LNotebook } from './database/notebook';
import { LNotebooks } from './database/notebooks';
import { DomainExplorerProvider } from './explorer/domainExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { vfs } from './helper';
import { LWebPanelView } from './panel/webPanelView';
import { DomainNode, NoteId } from './types';
// import { WebStatus } from './panel/web';

export class GlobalState {
  id: NoteId = '';
  nb: string | undefined; //notebook name
  lnb: LNotebook | undefined;

  update(nb: string) {
    this.nb = nb;
    this.lnb = ext.glnbs().get(nb);
  }
}

export namespace ext {
  export let context: ExtensionContext;
  export let domainProvider: DomainExplorerProvider;
  export let domainTreeView: TreeView<DomainNode>;
  export let filesProvider: FilesExplorerProvider;
  export let lwebPanelView: LWebPanelView;
  export let notespath: string;
  export let shortcutsFilePath: string;
  export const gs: GlobalState = new GlobalState();
  export let lnbs: LNotebooks;
  export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
  export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) =>
    context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
  export let domainShortcutStatusBarItem: StatusBarItem;
  export let windowId = (new Date()).getTime().toString();
  // for check active vscode windows when open multiple-vscode
  export const glnbs = () => { checkVscodeWindowChange(); return lnbs; };
  // export const webState = new WebStatus();

  // export const editNotes = new Map<string, string[]>();
}

// function getShortcutsFilePath() {
//     return path.join(ext.masterPath, 'shortcuts.json');
// }

export function listenConfiguration(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
      if (e.affectsConfiguration(section)) {
        const notespath = workspace.getConfiguration(section).get<string>('notespath');
        if (notespath === undefined || notespath === '') {
          window.showInformationMessage('configuretion "notespath" wrong.');
          return;
        }
        ext.notespath = notespath;
        ext.lnbs = new LNotebooks(ext.notespath);
        initializeExtensionVariables(ctx);
        ext.domainProvider.refresh();
      }
    })
  );
}

export function listenEditorFileClose(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidCloseTextDocument((e) => {
      if (
        ext.glnbs()
        && e.fileName === ext.glnbs().editor.getEditorFile()
        && ext.glnbs().editor.checkEditorFile()
      ) {
        ext.glnbs().editor.archiveEditor();
        ext.lwebPanelView.refresh();
        ext.domainProvider.refresh();
      }
    })
  );
}

export function listenEditorFileSave(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidSaveTextDocument((e) => {
      if (
        ext.glnbs()
        && e.fileName === ext.glnbs().editor.getEditorFile()
        && ext.glnbs().editor.checkEditorFile()
      ) {
        try {
          ext.glnbs().processEditor();
        } catch (e) {
          window.showErrorMessage(`${e}`);
          return;
        }
        ext.lwebPanelView.refresh();
      }
    })
  );
}

export function checkVscodeWindowChange() {
  const vscodeWindowChangeFile = path.join(ext.notespath, 'vswin');
  if (
    existsSync(vscodeWindowChangeFile)
    && vfs.readFileSync(vscodeWindowChangeFile) !== ext.windowId
  ) {
    window.showWarningMessage("vscode window change, lnote force refresh.")
    ext.windowId = (new Date()).getTime().toString();
    vfs.writeFileSync(vscodeWindowChangeFile, ext.windowId);
    ext.glnbs().refresh();
  } else {
    vfs.writeFileSync(vscodeWindowChangeFile, ext.windowId);
  }
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
  ext.context = ctx;

  const notespath = workspace.getConfiguration(section).get<string>('notespath');

  if (notespath === undefined || notespath === '') {
    return;
  }
  ext.notespath = notespath.endsWith('/') ? notespath : notespath + '/';
  ext.lnbs = new LNotebooks(ext.notespath);
  // ext.gs = new GlobalState();

  if (!ext.lwebPanelView) {
    ext.lwebPanelView = new LWebPanelView();
  }

  if (!ext.domainProvider || !ext.domainTreeView) {
    ext.domainProvider = new DomainExplorerProvider();
    ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
  }

  if (!ext.filesProvider) {
    ext.filesProvider = new FilesExplorerProvider();
    window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
  }

  // if (!ext.domainProvider || !ext.domainTreeView) {
  //     ext.domainProvider = new DomainExplorerProvider(ext.domainDB);
  //     ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
  // }

  // if (!ext.filesProvider) {
  //     ext.filesProvider = new FilesExplorerProvider();
  //     window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
  // }
  // if (!ext.domainShortcutStatusBarItem) {
  //     ext.domainShortcutStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 1);
  //     ext.domainShortcutStatusBarItem.text = '$(list-unordered) Domains(Last)';
  //     ext.domainShortcutStatusBarItem.command = 'lnote.shortcuts.last';
  //     ext.domainShortcutStatusBarItem.show();
  //     ext.context.subscriptions.push(ext.domainShortcutStatusBarItem);
  // }
}

