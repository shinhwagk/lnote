// import { Repository, Reference, Signature } from 'nodegit';
// import * as path from 'path';
// import { ext } from './extensionVariables';

// type operation = 'delete' | 'add';

// function message(op: operation, dpath: string, nId?: number): string {
//     if (nId) {
//         return `${op} note -> ${dpath}`;
//     }

//     return `${op} domain -> ${dpath}`;
// }

// function getRepository(dbDirPath: string): Promise<Repository> {
//     return Repository.open(dbDirPath);
// }

// export async function commit(repo: Repository, msg: string, file: string, author: Signature) {
//     await repo.createCommitOnHead([file], author, author, msg);
// }
