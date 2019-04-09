import * as https from 'https';
import { tools } from './helper';
import { homedir } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, ensureFileSync } from 'fs-extra';
import * as querystring from 'querystring';
import { version } from '../package.json';

export let checkFirst = false;

function genUserId() {
    return tools.hexRandom(10);
}

function initUserId() {
    const userIdFile = join(homedir(), '.vscode-note', 'clientId');
    if (!existsSync(userIdFile)) {
        checkFirst = true;
        ensureFileSync(userIdFile);
        const userId = genUserId();
        vfs.writeFileSync(userIdFile, userId);
        postGA(userId)(true)('vscode-note', 'installed');
    }
    return vfs.readFileSync(userIdFile);
}

const postGA = (userId: string) => (collect: boolean) => (ec: string, ea: string) => {
    if (!collect) return Promise.resolve();
    const uid = userId;
    const tid = 'UA-137490130-1';
    const t = 'event';
    const v = 1;
    const an = 'vscode-note';
    const av = version;
    const body = { v, tid, uid, t, ec, ea, an, av };

    const data = querystring.stringify(body);

    return new Promise<void>((resolve, reject) => {
        const options = {
            host: 'www.google-analytics.com',
            path: '/collect',
            method: 'POST'
        };

        const req = https.request(options, (res) => {
            res.setEncoding('utf8');
            res.on('end', () => resolve());
            res.on('error', (err) => reject(err.message));
        });

        req.on('error', (err) => reject(err.message));
        req.write(data);
        req.end();
    });
};

const _pga = postGA(initUserId());

export const pga = (collect: boolean) => (ec: string, ea: string) => {
    _pga(collect)(ec, ea).catch(e => console.error(`ga error: ${e}`));
};
