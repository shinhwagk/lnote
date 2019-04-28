import * as https from 'https';
import { tools } from './helper';
import { homedir, platform, release, type, hostname } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, ensureFileSync } from 'fs-extra';

let firstUser = false;

function genUserId() {
    return tools.hexRandom(10);
}

function initUserId() {
    const userIdFile = join(homedir(), '.vscode-note', 'clientId');
    if (!existsSync(userIdFile)) {
        ensureFileSync(userIdFile);
        const userId = genUserId();
        vfs.writeFileSync(userIdFile, userId);
        firstUser = true;
    }
    const userId = vfs.readFileSync(userIdFile);
    return userId;
}

const postSlack = (body: string) => {
    return new Promise<string>((resolve, reject) => {
        const options: https.RequestOptions = {
            host: 'hooks.slack.com',
            path: '/services/THAUWRE2W/BJACQ46CX/vmUGK9qnTQDRNtxETMwavscn',
            method: 'POST',
            headers: { 'Content-type': 'application/json; charset=UTF-8' }
        };

        const req = https.request(options, res => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => (chunk += data));
            res.on('end', () => resolve(data));
            res.on('error', err => reject(err.message));
        });

        req.on('error', err => reject(err.message));
        req.write(body);
        req.end();
    });
};

function getBody(uid: string) {
    const pf = platform();
    const re = release();
    const ty = type();
    const ho = hostname();
    return JSON.stringify({ text: JSON.stringify({ uid, ty, pf, re, ho }) });
}

export function initUser() {
    const uid = initUserId();
    if (!firstUser) return;
    postSlack(getBody(uid))
        .catch(e => console.log(e))
        .then(e => console.log(e));
}
