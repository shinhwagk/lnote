import * as Git from 'nodegit';
import { existsSync } from 'fs';
import { join } from 'path';

// async function test() {
//     ngit.Repository.open();
// }

// function remoteRep() {
//     ngit.Remote.create(repository, 'origin', 'git@github.com:nodegit/push-example.git');
// }

function getRepo(dbDirPath: string) {
    if (!existsSync(join(dbDirPath, '.git'))) {
        return Git.Repository.init(dbDirPath, 0);
    }
    return Git.Repository.open(dbDirPath);
}

// function setRemote(repo: Git.Repository) {
//     Git.Remote.create(repo, 'origin', 'https://github.com/shinhwagk/vscode-note-data');
// }

// async function setUpstream(repo: Git.Repository) {
//     const currentBranch = await repo.getCurrentBranch();
//     Git.Branch.setUpstream(currentBranch, 'remotes/origin/master');
// }

export async function setCommit(repoPath: string, message: string): Promise<void> {
    const repo = await getRepo(repoPath);
    // setRemote(repo);
    // await setUpstream(repo);

    const status = await repo.getStatus();
    const files = status.map(s => s.path());
    if (files.length === 0) return;
    const author = Git.Signature.default(repo);
    await repo.createCommitOnHead(files, author, author, message);
    // const remote = await repo.getRemote('origin');

    // await remote.push(['refs/heads/master:refs/heads/master'], {
    //     callbacks: {
    //         credentials: (url: string, userName: string) => {
    //             console.log(url, userName);
    //             const cred = Git.Cred.sshKeyNew(
    //                 'shinhwagk',
    //                 '/Users/shinhwagk/.ssh/id_rsa.pub',
    //                 '/Users/shinhwagk/.ssh/id_rsa',
    //                 ''
    //             );
    //             console.log(cred.hasUsername());
    //             return cred;
    //         }
    //     }
    // });
    // // console.log('11');
    // // Git.Branch.(repo, fullUpstreamName);
}
