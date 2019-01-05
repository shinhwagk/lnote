import * as path from "path";

import * as vscode from 'vscode';

let panel: vscode.WebviewPanel | undefined = undefined;

function updateWebviewPanel(i: vscode.Uri) {
    if (panel) {
        panel.webview.postMessage(domain);
    }
}

const domain = [{ name: "00000000", notes: [{ id: 11, contents: ["ccc", "kkk"] }] },
{ name: "00000001", notes: [{ id: 11, contents: ["ccc", "kkk"] }] }];

function getWebviewContent(context: vscode.ExtensionContext) {
    const scriptPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, 'public', 'main.js'));
    const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Cat Coding</title>
	</head>
	<body>
		<div id="root"></div>
		<script src="${scriptUri}"></script>
	</body>
	</html>`;
}


export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('updateOrCreateWebview', (i: vscode.Uri) => {
            if (!panel) {
                panel = vscode.window.createWebviewPanel('catCoding', 'vs notes', vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        localResourceRoots: [
                            vscode.Uri.file(path.join(context.extensionPath, "public"))
                        ]
                    },

                );
                panel.webview.html = getWebviewContent(context);
            }
            // vscode.window.showInformationMessage(i.path);
            updateWebviewPanel(i);
        })
    );
}


// export class CatCodingSerializer {
// 	private panel: vscode.WebviewPanel | undefined = undefined;
// 	constructor() {
// 		this.panel = vscode.window.createWebviewPanel(
// 			'catCoding',
// 			'vs notes',
// 			vscode.ViewColumn.One,
// 			{ enableScripts: true }
// 		);

// 		this.panel.webview.html = getWebviewContent();
// 	}
// 	public update(i: vscode.Uri) {
// 		this.panel.webview.postMessage({ command: { a: 1 } });
// 	}
// }








// import { emptyNodeIdxObj, genNoteMate, workspaceRoot } from "./vsnote.lib";
// import { ICategory, IIndex, INote } from "./vsnote.note";

// export class HtmlNote {
// 	private _notePath: string;
// 	private _noteMeta: IIndex;

// 	constructor(notePath: string) {
// 		this._notePath = notePath;
// 		this._noteMeta = genNoteMate(notePath);
// 	}

// 	public generateHTML() {
// 		if (this._notePath) {
// 			const categorysHtml = this._noteMeta.categorys.map((category, idx) => this.category(category, idx)).join("");
// 			return `<body>${categorysHtml}</body>`;
// 		} else {
// 			return "";
// 		}
// 	}

// 	private category(category: ICategory, cIdx: number): string {
// 		const cols = category.cols;
// 		const notes = category.notes;
// 		const cName = category.name;
// 		return `<h3>${cName} &nbsp; ${this.insertNoteButton(cIdx)} ${this.updateCategoryButton(cIdx)}</h3><table border="1" style="width:100%">` +
// 			"<table border='1' width='100%'>" + notes.map((note) => this.note(cIdx, cols, note)).join("") + "</table>";
// 	}

// 	private note(cIdx: number, cols: number, note: INote): string {
// 		const func = (n: number) => fs.readFileSync(path.join(workspaceRoot, "notes", note.i.toString(), n.toString()), "utf-8");

// 		const noteHtml = ["<tr>"];
// 		noteHtml.push(`<td width="5%"><a>${note.i} ${this.viewDoc(note.d, note.i)} ${this.viewFile(note.f)}</a></td>`);
// 		for (let i = 1; i <= cols; i++) {
// 			noteHtml.push(`<td><pre>${func(i)}</pre></td>`);
// 		}
// 		noteHtml.push(`<td width="5%">`);
// 		for (let i = 1; i <= cols; i++) {
// 			noteHtml.push(this.updateNoteButton(note.i, i));
// 		}
// 		noteHtml.push(this.updateNoteDocButton(cIdx, note.i));
// 		noteHtml.push(this.updateNoteFileButton(note.i));
// 		noteHtml.push(this.deleteNoteButton(cIdx, note.i));
// 		noteHtml.push("</td>");
// 		noteHtml.push("</tr>");
// 		return noteHtml.join("");
// 	}

// 	private href(command: string, ...args: any[]): string {
// 		return encodeURI("command:extension." + command + "?" + JSON.stringify(args));
// 	}

// 	private insertNoteButton(cIdx: number): string {
// 		return `<a style="color:red" href="${this.href("insert.note", this._notePath, cIdx)}">Insert</a>`;
// 	}

// 	private deleteNoteButton(cIdx: number, nIdx: number) {
// 		return `<a style="color:red" href="${this.href("delete.note", this._notePath, cIdx, nIdx)}">Delete</a>`;
// 	}

// 	private updateNoteButton(nId: number, nNum: number) {
// 		return `<a style="color:red" href="${this.href("update.note", nId, nNum)}">U-n-${nNum}</a><br/>`;
// 	}

// 	private updateCategoryButton(cIdx: number) {
// 		return `<a style="color:red" href="${this.href("update.category", this._notePath, cIdx)}">Update Category</a>`;
// 	}

// 	private updateNoteDocButton(cIdx: number, nId: number) {
// 		return `<a style="color:red" href="${this.href("update.note.doc", this._notePath, cIdx, nId)}">U-d</a><br/>`;
// 	}

// 	private updateNoteFileButton(nIdx: number) {
// 		return `<a style="color:red" href="${this.href("update.note.file", this._notePath, nIdx)}">U-f</a><br/>`;
// 	}

// 	private viewDoc(e: number, nId: number) {
// 		const noteDocButton = `<a style="color:red" href="${this.href("preview.note.doc", nId)}">D</a>`;
// 		return e ? noteDocButton : "";
// 	}

// 	private viewFile(e: number) {
// 		return e ? "| <a>F</a>" : "";
// 	}

// }