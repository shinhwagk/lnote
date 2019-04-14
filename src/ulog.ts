import { existsSync } from 'fs-extra';
import { homedir } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { tools } from './helper';
import { version } from '../package.json';
import * as querystring from 'querystring';
import * as https from 'https';

const userIdFile = join(homedir(), '.vscode-note', 'clientId');
const userCount = join(homedir(), '.vscode-note', 'count');

function genUserId() {
    return tools.hexRandom(10);
}

function checkFirst() {
    const userIdFile = join(homedir(), '.vscode-note');
    return !existsSync(userIdFile);
}

function initFirst() {
    if (checkFirst) return;
    const userId = genUserId();
    vfs.writeFileSync(userCount, '1');
    vfs.writeFileSync(userIdFile, userId);
}

function IncUserCount() {
    const incCnt = Number(vfs.readFileSync(userCount)) + 1;
    vfs.writeFileSync(userCount, incCnt.toString());
}

if (checkFirst) {
    IncUserCount();
} else {
    initFirst();
}

const postGA = (collect: boolean) => (ec: string, ea: string) => {
    if (!collect) return Promise.resolve();
    const uid = vfs.readFileSync(userIdFile);
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

export const pga = (collect: boolean) => (ec: string, ea: string) => {
    postGA(collect)(ec, ea).catch(e => console.error(`ga error: ${e}`));
};
