import * as https from 'https';
import { tools } from './helper';
import { homedir, platform, release, type, hostname } from 'os';
import { join } from 'path';
import { vfs } from './helper';
import { existsSync, ensureFileSync } from 'fs-extra';

const clientIdFile = join(homedir(), '.vscode-note', 'clientId');
const actionsFile = join(homedir(), '.vscode-note', 'actions');

function genUserId() {
    return tools.hexRandom(10);
}

function initClientId() {
    if (!existsSync(clientIdFile)) {
        ensureFileSync(clientIdFile);
        const userId = genUserId();
        vfs.writeFileSync(clientIdFile, userId);
    }
    return vfs.readFileSync(clientIdFile);
}

function initAcrions() {
    if (!existsSync(actionsFile)) {
        ensureFileSync(actionsFile);
        vfs.writeFileSync(actionsFile, '{}');
    }
    return JSON.parse(vfs.readFileSync(actionsFile));
}

const postSlack = (body: any) => {
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
        req.write(JSON.stringify({ text: JSON.stringify(body) }));
        req.end();
    });
};

namespace ClientData {
    export function base() {
        const uid = initClientId();
        const pf = platform();
        const re = release();
        const ty = type();
        const ho = hostname();
        return { uid, ty, pf, re, ho };
    }
    export function actions() {
        return initAcrions();
    }
}

const doAction = (actions: any, action: string) => {
    const cnt = actions[action] || 0;
    actions[action] = cnt + 1;
    vfs.writeJsonSync(actionsFile, actions);
    const tmpAction: { [action: string]: number } = {};
    tmpAction[action] = actions[action];
    return tmpAction;
};

function makeBody(action: string) {
    const actions = ClientData.actions();
    const base = ClientData.base();
    return { actions: doAction(actions, action), base };
}

export function initClient() {
    postSlack(makeBody('active'));
    return (action: string) => postSlack(makeBody(action));
}
