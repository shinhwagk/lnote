import {
  ExtensionContext,
  workspace,
  window,
  ConfigurationChangeEvent,
  TreeView,
  commands,
  StatusBarItem
} from 'vscode';

import { DomainExplorerProvider, DomainNode } from './explorer/domainExplorer';
import { FilesExplorerProvider } from './explorer/filesExplorer';
import { section } from './constants';
import { NoteBookDatabase } from './database';
import { NotesPanelView } from './panel/notesPanelView';
import path from 'path';
import { tools } from './helper';

// import { initClient, sendGA } from './client';

export namespace ext {
  export let context: ExtensionContext;
  export let domainProvider: DomainExplorerProvider;
  export let domainTreeView: TreeView<DomainNode>;
  export let filesProvider: FilesExplorerProvider;
  export let notesPanelView: NotesPanelView;
  export let notebookPath: string;
  export let shortcutsFilePath: string;
  export let globalState: GlobalState;
  export let notebookDatabase: NoteBookDatabase;
  export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
  export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) =>
    context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
  export let domainShortcutStatusBarItem: StatusBarItem;
  export const editNotes = new Map<string, string[]>();
}

// function getShortcutsFilePath() {
//     return path.join(ext.masterPath, 'shortcuts.json');
// }

export function listenConfiguration(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidChangeConfiguration(async (e: ConfigurationChangeEvent) => {
      if (e.affectsConfiguration(section)) {
        const notebookPath = workspace.getConfiguration(section).get<string>('notespath');
        if (notebookPath === undefined || notebookPath === '') {
          window.showInformationMessage('configuretion "notespath" wrong.');
          return;
        }
        ext.notebookPath = notebookPath;
        ext.notebookDatabase = new NoteBookDatabase(ext.notebookPath);
        initializeExtensionVariables(ctx);
        ext.domainProvider.refresh();
      }
    })
  );
}

export function listenNoteClose(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidCloseTextDocument((f) => {
      if (ext.notebookDatabase === undefined) { return; }
      const notesCacheDirectory = ext.notebookDatabase.notesCacheDirectory;
      if (f.uri.fsPath.startsWith(notesCacheDirectory)) {
        const fileName = path.basename(f.uri.fsPath);
        if (fileName.endsWith('.txt')) {
          const [nbName, nId, sdIdx] = fileName.split('.')[0].split('_');
          ext.notebookDatabase.removeEditNoteEnv(nbName, nId, Number(sdIdx));
        }
      }
    })
  );
}

export function listenNoteSave(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidSaveTextDocument((f) => {
      if (ext.notebookDatabase === undefined) { return; }
      if (f.uri.fsPath.startsWith(ext.notebookDatabase.notesCacheDirectory)) {
        const fileName = path.basename(f.uri.fsPath);
        if (fileName.endsWith('.txt')) {
          const [nbName, nId, sdIdx] = fileName.split('.')[0].split('_');
          const content = f.getText()
            .replace('\r\n', '\n')
            .trim();
          const contents = ext.notebookDatabase.getNBNotes(ext.globalState.nbName)[nId].contents;
          contents[Number(sdIdx)] = content;
          ext.notebookDatabase.updateNoteContents(nbName, nId, contents);
        }
      }
    })
  );
}

export function initializeExtensionVariables(ctx: ExtensionContext): void {
  ext.context = ctx;

  const notespath = workspace.getConfiguration(section).get<string>('notespath');

  if (notespath === undefined || notespath === '') {
    return;
  }
  ext.notebookPath = notespath.endsWith('/') ? notespath : notespath + '/';
  ext.notebookDatabase = new NoteBookDatabase(ext.notebookPath);
  ext.globalState = new GlobalState();

  if (!ext.notesPanelView) {
    ext.notesPanelView = new NotesPanelView();
  }

  if (!ext.domainProvider || !ext.domainTreeView) {
    ext.domainProvider = new DomainExplorerProvider();
    ext.domainTreeView = window.createTreeView('domainExplorer', { treeDataProvider: ext.domainProvider });
  }

  if (!ext.filesProvider) {
    ext.filesProvider = new FilesExplorerProvider();
    window.createTreeView('filesExplorer', { treeDataProvider: ext.filesProvider });
  }

  // if (!ext.notesPanelView) {
  //     ext.notesPanelView = new NotesPanelView();
  // }

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
  //     ext.domainShortcutStatusBarItem.command = 'vscode-note.shortcuts.last';
  //     ext.domainShortcutStatusBarItem.show();
  //     ext.context.subscriptions.push(ext.domainShortcutStatusBarItem);
  // }
}

export class GlobalState {
  nId: string = '';
  domainNode: DomainNode = '';
  domainNodeFormat: string[] = [];
  nbName: string = ''; //notebook name

  update(domainNode: string) {
    this.domainNode = domainNode;
    this.domainNodeFormat = tools.splitDomaiNode(domainNode);
    this.nbName = this.domainNodeFormat[0];
  }
}
