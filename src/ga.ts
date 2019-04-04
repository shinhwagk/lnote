import * as https from 'https';
import { tools } from './helper';
import { homedir } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, ensureFileSync } from 'fs-extra';
import * as querystring from 'querystring';

function genUserId() {
    return tools.hexRandom(10);
}

function initUserId() {
    const userIdFile = join(homedir(), '.vscode-note', '.userId');
    if (!existsSync(userIdFile)) {
        ensureFileSync(userIdFile);
        vfs.writeFileSync(userIdFile, genUserId());
    }
    return vfs.readFileSync(userIdFile);
}

const postGA = (userId: string) => (collect: boolean) => (ec: string, ea: string) => {
    if (!collect) return Promise.resolve();
    const cid = userId;
    const tid = 'UA-137490130-1';
    const t = 'event';
    const v = 1;
    const body = { v, tid, cid, t, ec, ea };
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

        req.write(data);
        req.end();
        req.on('error', (err) => reject(err.message));
    });
};

export const pga = (collect: boolean) => (ec: string, ea: string) =>
    postGA(initUserId())(collect)(ec, ea).catch(e => console.error(`ga error: ${e}`));

