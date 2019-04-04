import * as https from 'https';
import { tools } from './helper';
import { homedir, platform } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, ensureFileSync } from 'fs-extra';
import * as querystring from 'querystring';
import { version } from '../package.json';

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
    if (!collect) return Promise.resolve();
    const cid = `${platform()}-${version}`;
    const uid = userId;
    const tid = 'UA-137490130-1';
    const t = 'event';
    const v = 1;
    const body = { v, tid, cid, uid, t, ec, ea };
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

const _pga = postGA(initUserId());

export const pga = (collect: boolean) => (ec: string, ea: string) => {
    _pga(collect)(ec, ea).catch(e => console.error(`ga error: ${e}`));
}

