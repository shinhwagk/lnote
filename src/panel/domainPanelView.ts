import * as vscode from 'vscode';

import { ext } from '../extensionVariables';
import { ExtCmds } from '../extensionCommands';
import { LNote } from '../database/note';
import { IWebNote } from './types';
import { tools } from '../helper';

export class DomainPanelView {
  private panel: vscode.WebviewPanel | undefined = undefined;

  private getWebviewContent() {
    const stylesPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'main.css');
    const jsPathMainPath = vscode.Uri.joinPath(ext.context.extensionUri, 'out', 'main.js');
    const stylesMainUri = this.panel?.webview.asWebviewUri(stylesPathMainPath);
    const jsMainUrl = this.panel?.webview.asWebviewUri(jsPathMainPath);
    // const cspSource = this.panel?.webview.cspSource
    const nonce = tools.getNonce();
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

  async show(): Promise<void> {
    if (this.panel) {
      this.panel!.reveal(vscode.ViewColumn.One);
      // await this.postData();
      return;
    }

    this.initPanel();
  }

  private convertForWebStruct(notes: LNote[]): IWebNote[] {
    return notes
      .map(n => {
        const isDoc = n.checkDocExist();
        const isFiles = n.checkFilesExist();
        const _n = JSON.parse(JSON.stringify(n)); // clone obj
        const alOfNote = n.getDataArrayLabels(); //.concat(ext.gs.nbName);
        _n['labels'] = alOfNote;
        return { nb: n.getnb(), nId: n.getId(), doc: isDoc, files: isFiles, labels: alOfNote, ..._n };
      });
  }

  public async postNotes(notes: IWebNote[]) {
    await this.panel!.webview.postMessage({
      command: 'post-notes',
      data: { notes: notes }
    });
  }

  private initPanel() {
    this.panel = vscode.window.createWebviewPanel(
      'lnote',
      'lnote domain',
      vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(ext.context.extensionUri, 'out')],
      retainContextWhenHidden: true
    }
    );

    this.panel.iconPath = vscode.Uri.joinPath(ext.context.extensionUri, 'images/wv-icon.svg');
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        console.log('vsnote webview closed.');
      },
      null,
      ext.context.subscriptions
    );
    this.panel.webview.onDidReceiveMessage(
      async (msg) => {
        switch (msg.command) {
          case 'get-data':
            const notes = ext.lnbs.get(ext.gs.domainNode[0]).getNotes(ext.gs.domainNode);
            await this.postNotes(this.convertForWebStruct(notes));
            break;
          case 'web-update-labels':
            // await this.postData();
            break;
          case 'notebook-editor':
            ExtCmds.cmdHdlNoteEditor(msg.data.params);
            break;
          case 'notebook-note-doc-show':
            ExtCmds.cmdHdlNoteDocShow(msg.data.nId);
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
          case 'edit-note-openfolder':
            ExtCmds.cmdHdlNoteOpenFolder(msg.data.nId);
            break;
        }
      },
      undefined,
      ext.context.subscriptions
    );
    this.panel.webview.html = this.getWebviewContent();
  }
}
