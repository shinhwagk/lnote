import * as https from 'https';
import { tools } from './helper';
import { homedir, platform, release, type, hostname } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, ensureFileSync } from 'fs-extra';

function genUserId() {
    return tools.hexRandom(10);
}

function initClientId() {
    const clientIdFile = join(homedir(), '.vscode-note', 'clientId');
    if (!existsSync(clientIdFile)) {
        ensureFileSync(clientIdFile);
        const userId = genUserId();
        vfs.writeFileSync(clientIdFile, userId);
    }
    const userId = vfs.readFileSync(clientIdFile);
    return userId;
}

function initUsage() {
    const usageFile = join(homedir(), '.vscode-note', 'usage');
    if (!existsSync(usageFile)) {
        ensureFileSync(usageFile);
        vfs.writeFileSync(usageFile, '{}');
    }
    const usage = JSON.parse(vfs.readFileSync(usageFile));
    const active = usage['active'] || 0;
    usage['active'] = active + 1;
    vfs.writeJsonSync(usageFile, usage);
    return usage;
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
        req.write(JSON.stringify({ text: body }));
        req.end();
    });
};

namespace ClientData {
    export function baseInfo(uid: string) {
        const pf = platform();
        const re = release();
        const ty = type();
        const ho = hostname();
        return { uid, ty, pf, re, ho };
    }
    export function usageInfo() {
        return initUsage();
    }
}

export function initClient() {
    const uid = initClientId();
    const usage = ClientData.usageInfo();
    const base = ClientData.baseInfo(uid);
    const body = { usage, base };
    postSlack(JSON.stringify(body))
        .catch(e => console.log(e))
        .then(e => console.log(e));
}
