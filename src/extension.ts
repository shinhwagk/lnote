import * as vscode from 'vscode';

// import * as tree from "./treeview";
// import { VSNWebviewView } from './webview.view';
// import * as db from "./database";
// import { VSNWebviewForm } from './webview.form';
console.info("44444")
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "helloworld-sample" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    vscode.window.showInformationMessage('Hello World!');
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);
    // context.subscriptions.push(vscode.commands.registerCommand("extension.ffff", () => {
    //     vscode.window.showInformationMessage("11212121");
    // }));

    // const vsnoteDB = new db.VSNDatabase();
    // tree.activateVSNoteTreeViewExplorer(context);
    // VSNWebviewView(context, vsnoteDB);
    // const vvv = VSNWebviewForm.activate(context);

    // context.subscriptions.push(vvv.commandhandler());
}

export function deactivate() { }