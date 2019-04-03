import { post } from 'got';
import { tools } from './helper';
import { homedir } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, ensureFileSync } from 'fs-extra';

function genUserId() {
    return tools.hexRandom(10);
}

function initUserId() {
    const userIdFile = join(homedir(), '.vscode-note', 'userId');
    if (!existsSync(userIdFile)) {
        ensureFileSync(userIdFile);
        vfs.writeFileSync(userIdFile, genUserId());
    }
    return vfs.readFileSync(userIdFile);
}

const postGA = (userId: string) => (collect: boolean) => (ec: string, ea: string) => {
    if (!collect) return;
    const cid = userId;
    const tid = 'UA-137490130-1';
    const t = 'event';
    const v = 1;
    const body = { v, tid, cid, t, ec, ea };
    const form = true;
    post('https://www.google-analytics.com/collect', { form, body }).catch(console.error);
};

export const pga = postGA(initUserId());
