import { extensions, window } from 'vscode';
import { GitExtension } from '../typings/git';

export class GitNotes {

    dbDirPath: string;
    gitBin: string | undefined = undefined;

    constructor(dbDirPath: string) {
        this.dbDirPath = dbDirPath;
        this.registerGitBin();
    }

    registerGitBin() {
        const gitExtension = extensions.getExtension<GitExtension>('vscode.git');
        if (gitExtension) {
            gitExtension.activate().then(x => this.gitBin = x.getAPI(1).git.path);
        }
    }

    gitAction() {

    }

    async commit(message: string) {

    }

    async add() {

    }
}
