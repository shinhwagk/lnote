import { extensions } from 'vscode';
import { GitExtension } from '../typings/git';
import { getConfigure } from './extensionVariables';

export class GitNotes {

    dbDirPath: string;
    gitBin: string | undefined = undefined;
    github: string;

    constructor(dbDirPath: string, _github: string) {
        this.dbDirPath = dbDirPath;
        this.registerGitBin();
        this.github = getConfigure('github', '');
    }

    checkInitGit() {

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
        return message;
    }

    async add() {

    }
}
