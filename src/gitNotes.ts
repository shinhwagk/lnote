import { extensions, commands, window, Uri } from 'vscode';
import { GitExtension, Repository, API } from '../typings/git';

export class GitNotes {

    dbUri: Uri;
    github: string;
    vscodeRepo: Repository | undefined = undefined;
    git: API | undefined = undefined;
    constructor(dbDirPath: string, github: string) {
        this.dbUri = Uri.file(dbDirPath);
        this.registerRepository();
        this.github = github;
    }

    registerRepository() {
        const gitExtension = extensions.getExtension<GitExtension>('vscode.git');
        if (gitExtension) {
            gitExtension.activate().then(async (x) => {
                this.git = x.getAPI(1);
                await commands.executeCommand('git.openRepository', this.dbUri.fsPath);
            });
        }
    }

    async commit(message: string) {
        if (!this.git) { return; }
        const repos = this.git.repositories.filter(r => r.rootUri.fsPath === this.dbUri.fsPath);
        if (repos.length === 0) { return; }
        repos[0].inputBox.value = message;
        await commands.executeCommand('git.stageAll', this.dbUri);
        await commands.executeCommand('git.commitAll', this.dbUri);

        if (!this.github) { return; }
        if (repos[0].state.remotes.length === 0) {
            await repos[0].addRemote('origin', this.github)
        }
        if (repos[0].state.remotes.length === 0) {
            window.showInformationMessage('dfdfdfd')
        }

        try {
            await commands.executeCommand('git.push', this.dbUri);
            window.showInformationMessage('git.push')
        } catch (e) {
            window.showInformationMessage("push error" + e)
        }
    }
}
