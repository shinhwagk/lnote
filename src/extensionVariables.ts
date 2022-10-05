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
import { NotesPanelView } from './panel/notesPanelView';
import path from 'path';
import { tools } from './helper';
import { VNNotebook } from './database/notebook';
import { NBNote } from './database/note';
import { NBDomain } from './database/domain';

// import { initClient, sendGA } from './client';

export class GlobalState {
  nId: string = '';
  domainNode: DomainNode;
  domainNodeFormat: string[];
  nbName: string; //notebook name
  nbNotes: NBNote;
  nbDomain: NBDomain;
  // vnNoteBook: VNNotebook;

  constructor(domainNode: string) {
    this.domainNode = domainNode;
    this.domainNodeFormat = tools.splitDomaiNode(domainNode);
    this.nbName = this.domainNodeFormat[0];
    const { domain, notes } = ext.vnNotebook.getNB(this.nbName)!;
    this.nbDomain = domain;
    this.nbNotes = notes;
    // this.vnNoteBook = new VNNotebook(ext.notebookPath)
  }

  static update(domainNode: string) {
    ext.gs = new GlobalState(domainNode);
  }
}


export namespace ext {
  export let context: ExtensionContext;
  export let domainProvider: DomainExplorerProvider;
  export let domainTreeView: TreeView<DomainNode>;
  export let filesProvider: FilesExplorerProvider;
  export let notesPanelView: NotesPanelView;
  export let notebookPath: string;
  export let shortcutsFilePath: string;
  export let gs: GlobalState;
  export const updateGS = GlobalState.update;
  export let vnNotebook: VNNotebook;
  export const setContext = <T>(ctx: string, value: T) => commands.executeCommand('setContext', ctx, value);
  export const registerCommand = (command: string, callback: (...args: any[]) => any, thisArg?: any) =>
    context.subscriptions.push(commands.registerCommand(command, callback, thisArg));
  export let domainShortcutStatusBarItem: StatusBarItem;
  // export const editNotes = new Map<string, string[]>();
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
        ext.vnNotebook = new VNNotebook(ext.notebookPath);
        initializeExtensionVariables(ctx);
        ext.domainProvider.refresh();
      }
    })
  );
}

export function listenNoteClose(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidCloseTextDocument((f) => {
      if (ext.vnNotebook === undefined) { return; }
      if (f.uri.fsPath.startsWith(ext.gs.nbNotes.getEditCacheDirectory())) {
        const fileName = path.basename(f.uri.fsPath);
        if (fileName.endsWith('.yaml')) {
          const [nId,] = fileName.split('.');
          ext.gs.nbNotes.removeEditNoteEnv(nId);
          ext.notesPanelView.postNote(ext.gs.nbNotes.getNoteByid(nId));
        }
      }
    })
  );
}

export function listenNoteSave(ctx: ExtensionContext) {
  ctx.subscriptions.push(
    workspace.onDidSaveTextDocument((f) => {
      if (ext.vnNotebook === undefined) { return; }
      if (f.uri.fsPath.startsWith(ext.gs.nbNotes.getEditCacheDirectory())) {
        const fileName = path.basename(f.uri.fsPath);
        if (fileName.endsWith('.yaml')) {
          const [nId,] = fileName.split('.');
          const enote = tools.readYamlSync(f.uri.fsPath);
          ext.gs.nbNotes.updateNote(nId, enote.contents, enote.labels);
          ext.notesPanelView.postNote(ext.gs.nbNotes.getNoteByid(nId));
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
  ext.vnNotebook = new VNNotebook(ext.notebookPath);
  // ext.gs = new GlobalState();

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

