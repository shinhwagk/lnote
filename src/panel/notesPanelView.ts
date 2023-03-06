import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ExtCmds } from '../extensionCommands';
import { tools } from '../helper';
import { INBNote, NBNote } from '../database/note';

export class NotesPanelView {
  private panel: vscode.WebviewPanel | undefined = undefined;
  private domainNode: string[] = [];

  // private assetsFile = (name: string) => {
  //   const file = path.join(ext.context.extensionPath, 'out', name);
  //   return vscode.Uri.file(file).with({ scheme: 'vscode-resource' }).toString();
  // };

  // const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
  private getWebviewContent() {
    const stylesPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'main.css');
    const jsPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'main.js');
    const stylesMainUri = this.panel?.webview.asWebviewUri(stylesPathMainPath);
    const jsMainUrl = this.panel?.webview.asWebviewUri(jsPathMainPath);
    // const cspSource = this.panel?.webview.cspSource
    const nonce = getNonce();
    return `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${stylesMainUri}" rel="stylesheet">
                    <script nonce="${nonce}" src="https://kit.fontawesome.com/61b8139299.js" crossorigin="anonymous" ></script>
                    <title>lnote</title>
                </head>
                <body>
                    <div id="root">
                        <div id="content"></div>
                        <ul id="contextMenu" class="contextMenu"></ul>
                    </div>
                    <script>
                        const vscode = acquireVsCodeApi();
                    </script>
                    <script nonce="${nonce}" src="${jsMainUrl}"></script>
                </body>
                </html>`;
  }

  async showNotesPlanView(): Promise<void> {
    if (this.panel) {
      this.panel!.reveal(vscode.ViewColumn.One);
      await this.postData();
      return;
    }

    this.initPanel();
  }

  private getNotesForWebStruct(domainNode: string[]): NBNote[] {
    const alOfDomain = ext.gs.nb.getArrayLabelsOfDomain(domainNode);
    // const nbNotes = ext.gs.nb.getLabelsOfDomain;
    return ext.gs.nb.getNotesByArrayLabels(alOfDomain)
      .filter(n =>
        tools.intersections(alOfDomain, n.getDataArrayLabels()).length === alOfDomain.length
      )
      .map(n => {
        const isDoc = n.checkDocExist();
        const isFiles = n.checkFilesExist();
        const _n = JSON.parse(JSON.stringify(n)); // clone obj
        const alOfNote = n.getDataArrayLabels(); //.concat(ext.gs.nbName);
        _n['labels'] = alOfNote;
        return { nId: n.getId(), doc: isDoc, files: isFiles, labels: alOfNote, ..._n };

      });
  }

  public async postData() {
    await this.panel!.webview.postMessage({
      command: 'post-data',
      data: {
        domainNotes: this.getNotesForWebStruct(this.domainNode),
        domainNode: this.domainNode,
        // domainGroupLabel: ext.gs.nb.getGroupLabelOfDomain(this.domainNode),
        domainArrayLabel: ext.gs.nb.getArrayLabelsOfDomain(this.domainNode)
      }
    });
  }

  // public async postNote(note: any) {
  //   this.panel!.webview.postMessage({
  //     command: 'post-note',
  //     data: { note: note }
  //   });
  // }

  // public async removeNote(nId: string) {
  //   this.panel!.webview.postMessage({
  //     command: 'delete-note',
  //     data: { nId: nId }
  //   });
  // }

  private initPanel() {
    this.panel = vscode.window.createWebviewPanel('lnote', 'lnote', vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(ext.context.extensionUri, 'out')]
    });

    this.panel.iconPath = vscode.Uri.joinPath(ext.context.extensionUri, 'images/wv-icon.svg');
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        console.log('vsnote webview closed.');
      },
      null,
      ext.context.subscriptions
    );
    this.panel.onDidChangeViewState(
      (e) => {
        const panel = e.webviewPanel;
        if (panel.visible) {
          // this.parseDomain();
          // this.showNotesPlanView();
        }
      },
      null,
      ext.context.subscriptions
    );
    this.panel.webview.onDidReceiveMessage(
      async (msg) => {
        switch (msg.command) {
          case 'get-data':
            await this.postData();
            break;
          // case 'get-notes':
          //   this.panel!.webview.postMessage({
          //     command: 'post-notes',
          //     data: {
          //       notes: ext.vnNotebook.getNotesOfDomain(this.domainNode)
          //     }
          //   });
          //   break;
          // case 'get-domain':
          //   this.panel!.webview.postMessage({
          //     command: 'post-domain',
          //     data: {
          //       domainNode: this.domainNode,
          //       domainLabels: ext.vnNotebook.getLabelsOfDomain(this.domainNode).sort()
          //     }
          //   });
          //   console.log(ext.vnNotebook.getLabelsOfDomain(this.domainNode));
          //   break;
          // case 'get-labels':
          //   const labelsOfNotebook = [...ext.notebookDatabase.getNBLabels(this.domainNode[0]).keys()];
          //   const labelsOfDomainNode = ext.notebookDatabase.getLabelsOfDomain(this.domainNode);
          //   this.panel!.webview.postMessage({
          //     command: 'post-labels',
          //     data: {
          //       checkedLabels: labelsOfDomainNode,
          //       unCheckedLabels: labelsOfNotebook.filter(l => !labelsOfDomainNode.includes(l))
          //     }
          //   });
          //   break;
          // case 'get-notes-by-labels':
          //   const notes = ext.vnNotebook.getNotesByLabels(this.domainNode[0], msg.data.checkedLabels);
          //   this.panel!.webview.postMessage({
          //     command: 'post-notes',
          //     data: {
          //       notes: notes
          //     }
          //   });
          //   break;
          case 'note-add':
            ExtCmds.cmdHdlNoteAdd(msg.data.labels);
            break;
          case 'notebook-note-edit':
            ExtCmds.cmdHdlNoteEdit(msg.data.nId);
            break;
          case 'notes-edit-labels':
            ExtCmds.cmdHdlNotesEditlabels(msg.data.labels);
            break;
          // case 'notebook-note-contents-add':
          //   ExtCmds.cmdHdlNotebookNoteContentsAdd(msg.data.nId, msg.data.cn);
          //   break;
          case 'notebook-note-doc-show':
            ExtCmds.cmdHdlNotebookNoteDocShow(msg.data.nId);
            break;
          case 'notebook-note-files-open':
            ExtCmds.cmdHdlNoteFilesOpen(msg.data.nId);
            break;
          case 'notebook-note-files-create':
            ExtCmds.cmdHdlNoteFilesCreate(msg.data.nId);
            break;
          case 'notebook-note-doc-create':
            ExtCmds.cmdHdlNBNoteDocCreate(msg.data.nId);
            break;
          case 'note-remove':
            ExtCmds.cmdHdlNBNoteRemove(msg.data.nId);
            break;
          case 'edit-note-openfolder':
            ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
            break;
          case 'category-add':
            ExtCmds.cmdHdlDomainCategoryAdd();
            break;
          // case 'col-to-terminal':
          //   ExtCmds.cmdHdlNoteColToActiveTermianl(msg.data.id, msg.data.cidx);
          //   break;
          // case 'col-to-terminal-args':
          //   ExtCmds.cmdHdlNoteColToActiveTermianl(msg.data.id, msg.data.cidx);
          //   break;
          case 'domain-relabels':
            ExtCmds.cmdHdlDomainEditlabels();
            break;
        }
      },
      undefined,
      ext.context.subscriptions
    );
    this.panel.webview.html = this.getWebviewContent();
  }

  public parseDomain() {
    this.domainNode = ext.gs.domainNodeFormat;
    // this.viewData = this.genViewData(labels);
    return this;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
