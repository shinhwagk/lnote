import * as got from 'got';
import { tools } from './helper';
import { homedir } from 'os';
import * as path from 'path';
import { existsSync, readFileSync, writeFileSync, ensureFileSync } from 'fs-extra';

function genUserId() {
    return tools.hexRandom(10);
}

function initUserId() {
    const userIdFile = path.join(homedir(), '.vscode-note', 'userId');
    if (!existsSync(userIdFile)) {
        ensureFileSync(userIdFile);
        writeFileSync(userIdFile, genUserId());
    }
    return readFileSync(userIdFile);
}

export namespace GA {
    export async function collect(ec: string, ea: string) {
        postGA(ec, ea);
    }
}

function postGA(ec: string, ea: string) {
    const cid = initUserId();
    const tid = 'UA-137490130-1';
    const t = 'event';
    const v = 1;
    const body = { v, tid, cid, t, ec, ea };
    const form = true;
    got.post('https://www.google-analytics.com/collect', { form, body }).catch(console.error);
}
