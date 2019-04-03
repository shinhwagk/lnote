import { commands, extensions, window } from 'vscode';
import { Repository, GitExtension } from '../typings/git';

export class GitNotes {
    dbDirPath: string;
    repo: Repository | undefined = undefined;
    constructor(dbDirPath: string) {
        this.dbDirPath = dbDirPath;
        setTimeout(() => {
            this.dxxxdfd();
        }, 5000);
    }

    async openRepoOnVscode() {
        await commands.executeCommand('git.openRepository', this.dbDirPath);
    }

    dxxxdfd() {
        const gitExtension = extensions.getExtension<GitExtension>('vscode.git')!.exports;
        const git = gitExtension.getAPI(1);

        window.showInformationMessage(git.git.path);
    }

    async commit() {
        if (this.repo) {
            this.repo.inputBox.value = 'test';
            await commands.executeCommand('git.commit', this.repo);
        }
    }
}
